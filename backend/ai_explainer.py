from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import settings

class AIExplainer:
    def __init__(self):
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.3
            )
        except Exception as e:
            print(f"Failed to initialize AIExplainer: {e}")
            self.llm = None

    def explain_decision(self, decision: dict) -> dict:
        if not self.llm:
            return {
                "explanation": "AI explanation unavailable",
                "summary": "AI explainer not initialized",
                "risk": "Unknown",
                "should_challenge": False,
                "decision_id": decision.get("id"),
                "model_used": "None"
            }
            
        prompt_template = """
You are a financial risk analyst reviewing autonomous AI agent decisions on a blockchain.

An AI agent made the following decision:
- Action: {action}
- Stated Reason: {reason}  
- Amount: {amount} tokens
- Time: {timestamp}
- Status: {status_label}

Provide a structured analysis with exactly these 3 sections:

PLAIN ENGLISH SUMMARY:
(1-2 sentences explaining what the agent did in simple terms anyone can understand)

RISK ASSESSMENT:
(1-2 sentences identifying any potential risks or red flags in this decision)

SHOULD YOU CHALLENGE:
(Yes/No and a one-sentence reason why or why not)
"""
        try:
            prompt = ChatPromptTemplate.from_template(prompt_template)
            chain = prompt | self.llm | StrOutputParser()
            
            response = chain.invoke({
                "action": decision.get("action"),
                "reason": decision.get("reason"),
                "amount": decision.get("amount"),
                "timestamp": decision.get("timestamp"),
                "status_label": decision.get("status_label")
            })
            
            summary = ""
            risk = ""
            should_challenge_raw = ""
            
            # Simple parsing
            lines = response.split('\n')
            current_section = None
            for line in lines:
                line_stripped = line.strip()
                if "PLAIN ENGLISH SUMMARY:" in line_stripped:
                    current_section = "summary"
                    continue
                elif "RISK ASSESSMENT:" in line_stripped:
                    current_section = "risk"
                    continue
                elif "SHOULD YOU CHALLENGE:" in line_stripped:
                    current_section = "challenge"
                    continue
                
                if current_section == "summary" and line_stripped:
                    summary += line_stripped + " "
                elif current_section == "risk" and line_stripped:
                    risk += line_stripped + " "
                elif current_section == "challenge" and line_stripped:
                    should_challenge_raw += line_stripped + " "
                    
            should_challenge = "yes" in should_challenge_raw.lower()
            
            return {
                "explanation": response,
                "summary": summary.strip(),
                "risk": risk.strip(),
                "should_challenge": should_challenge,
                "decision_id": decision.get("id"),
                "model_used": "gemini-1.5-flash via LangChain"
            }
        except Exception as e:
            return {
                "explanation": "AI explanation unavailable",
                "error": str(e),
                "summary": "AI Error",
                "risk": "AI Error",
                "should_challenge": False,
                "decision_id": decision.get("id"),
                "model_used": "gemini-1.5-flash via LangChain"
            }

    def explain_batch(self, decisions: list[dict]) -> list[dict]:
        results = []
        for d in decisions:
            results.append(self.explain_decision(d))
        return results

ai_explainer = AIExplainer()
