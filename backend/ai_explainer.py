from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import settings

class AIExplainer:
    def __init__(self):
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-lite",  # Supported model, but subject to 20 RPM limit
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.3
            )
            print("AIExplainer initialized with gemini-2.5-flash-lite")
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

    def explain_intent(self, intent: dict) -> dict:
        if not self.llm:
            return {
                "explanation": "AI explanation unavailable",
                "risk_score": 5,
                "model_used": "None"
            }
            
        prompt_template = """
You are a financial risk auditor assessing an autonomous AI agent's proposed intent BEFORE it interacts with a blockchain network.

The agent wants to execute the following intent:
- Action: {action}
- Stated Reason: {reason}  
- Amount: {amount} tokens

Act as a financial auditor. Explain why this agent is moving funds. Is this a typical rebalancing or a high-risk anomaly?
Calculate a Risk Score (1-10, where 1 is safest and 10 is highest risk) based on perceived slippage, contract reputation, and liquidity risks based on the reason provided.

Provide a structured analysis with exactly these 2 sections:

EXPLANATION:
(2-3 sentences explaining your assessment of why the agent is moving funds and whether it's a typical rebalancing or high-risk anomaly)

RISK SCORE:
(Just a single integer from 1 to 10)
"""
        try:
            prompt = ChatPromptTemplate.from_template(prompt_template)
            chain = prompt | self.llm | StrOutputParser()
            
            response = chain.invoke({
                "action": intent.get("action", "Unknown"),
                "reason": intent.get("reason", "No reason provided"),
                "amount": intent.get("amount", 0)
            })
            
            explanation = ""
            risk_score = 5
            
            lines = response.split('\n')
            current_section = None
            for line in lines:
                line_stripped = line.strip()
                if "EXPLANATION:" in line_stripped:
                    current_section = "explanation"
                    continue
                elif "RISK SCORE:" in line_stripped:
                    current_section = "score"
                    continue
                
                if current_section == "explanation" and line_stripped:
                    explanation += line_stripped + " "
                elif current_section == "score" and line_stripped:
                    try:
                        import re
                        digits = re.findall(r'\d+', line_stripped)
                        if digits:
                            risk_score = int(digits[0])
                    except:
                        pass
                        
            return {
                "explanation": explanation.strip() or response,
                "risk_score": risk_score,
                "model_used": "gemini-1.5-flash via LangChain"
            }
        except Exception as e:
            return {
                "explanation": "AI Error: " + str(e),
                "risk_score": 5,
                "model_used": "gemini-1.5-flash via LangChain"
            }

ai_explainer = AIExplainer()
