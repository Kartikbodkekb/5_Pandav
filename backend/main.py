from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
from config import settings
from blockchain import blockchain_service
from ai_explainer import ai_explainer

app = FastAPI(title="Agentic Protocol API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

intents_db = {}

@app.on_event("startup")
async def startup_event():
    try:
        chain_info = blockchain_service.get_chain_info()
        if chain_info.get("connected"):
            print(f"Connected to HeLa Testnet, block #{chain_info.get('block_number')}")
        else:
            print("Failed to connect to HeLa Testnet")
    except Exception as e:
        print(f"Startup HeLa connection warning: {e}")
        
    print(f"Contract loaded: {settings.CONTRACT_ADDRESS}")
    print("AI Explainer ready (Gemini via LangChain)")
    print("Server running on http://0.0.0.0:8000")

# --- HEALTH & INFO ---

@app.get("/health")
def get_health():
    try:
        chain_info = blockchain_service.get_chain_info()
        return {
            "status": "ok",
            "hela_connected": chain_info.get("connected"),
            "chain_id": chain_info.get("chain_id"),
            "block_number": chain_info.get("block_number"),
            "contract_address": settings.CONTRACT_ADDRESS
        }
    except HTTPException as e:
        return {"status": "error", "error": e.detail}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "HeLa blockchain unreachable"})

# --- DECISIONS ---

@app.get("/decisions")
def get_decisions():
    try:
        decisions = blockchain_service.get_all_decisions()
        return {
            "decisions": decisions,
            "total": len(decisions),
            "hela_explorer": "https://testnet-blockexplorer.helachain.com"
        }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@app.get("/decisions/{id}")
def get_decision(id: int):
    try:
        return blockchain_service.get_decision(id)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# --- AI EXPLANATION ---

class BatchRequest(BaseModel):
    ids: list[int]

@app.get("/explain/{id}")
def explain_decision_endpoint(id: int):
    try:
        decision = blockchain_service.get_decision(id)
        explanation = ai_explainer.explain_decision(decision)
        
        return {
            "decision_id": id,
            "decision": decision,
            "explanation": explanation.get("explanation"),
            "summary": explanation.get("summary"),
            "risk": explanation.get("risk"),
            "should_challenge": explanation.get("should_challenge"),
            "model_used": explanation.get("model_used")
        }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@app.post("/explain/batch")
def explain_batch_endpoint(req: BatchRequest):
    decisions = []
    for d_id in req.ids:
        try:
            d = blockchain_service.get_decision(d_id)
            decisions.append(d)
        except Exception:
            pass
            
    explanations = ai_explainer.explain_batch(decisions)
    return explanations

# --- CHALLENGE ---

class ChallengeRequest(BaseModel):
    challenger_address: str

@app.post("/challenge/{id}")
def challenge_decision_endpoint(id: int, req: ChallengeRequest):
    try:
        decision = blockchain_service.get_decision(id)
        if not decision.get("is_challengeable"):
            # Check if expired
            current_time = int(time.time())
            expired_at = decision.get("timestamp") + settings.CHALLENGE_WINDOW_SECONDS
            if current_time > expired_at:
                raise HTTPException(status_code=400, detail={"error": "Challenge window closed", "expired_at": expired_at})
            else:
                raise HTTPException(status_code=400, detail=f"Decision not challengeable. Status is {decision.get('status_label')}")
                
        # Access abi directly if possible, else return list placeholder
        abi = blockchain_service.contract.abi if hasattr(blockchain_service, 'contract') else []
        
        return {
            "challengeable": True,
            "message": "Send transaction via MetaMask to challenge",
            "decision": decision,
            "contract_address": settings.CONTRACT_ADDRESS,
            "abi": abi,
            "function": "challengeDecision",
            "args": [id]
        }
    except HTTPException as e:
        # Avoid double-wrapping HTTPException
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/challenge/{id}/status")
def get_challenge_status(id: int):
    try:
        decision = blockchain_service.get_decision(id)
        current_time = int(time.time())
        expired_at = decision.get("timestamp") + settings.CHALLENGE_WINDOW_SECONDS
        time_remaining = max(0, expired_at - current_time) if decision.get("status") == 0 else 0
        
        return {
            "decision_id": id,
            "status": decision.get("status"),
            "status_label": decision.get("status_label"),
            "is_challengeable": decision.get("is_challengeable"),
            "time_remaining_seconds": time_remaining,
            "challenged_at": None # We don't track challenged_at in the struct currently
        }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# --- MOCK AGENT ---

class MockAgentRequest(BaseModel):
    action: str
    reason: str
    amount: int
    explanation_hash: str = ""

@app.post("/agent/trigger")
def trigger_agent(req: MockAgentRequest):
    try:
        tx_hash = blockchain_service.log_decision(req.action, req.reason, req.amount, req.explanation_hash, settings.PRIVATE_KEY)
        return {
            "success": True,
            "tx_hash": tx_hash,
            "action": req.action,
            "hela_explorer_url": f"https://testnet-blockexplorer.helachain.com/tx/{tx_hash}"
        }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# --- INTENT LOGGER & VERIFICATION ---

class SubmitIntentRequest(BaseModel):
    action: str
    reason: str
    amount: int

@app.post("/audit/submit-intent")
def submit_intent(req: SubmitIntentRequest):
    intent_data = {
        "action": req.action,
        "reason": req.reason,
        "amount": req.amount,
        "timestamp": int(time.time())
    }
    
    # 1. Generate Explanation & Risk Score BEFORE it hits network
    explanation_res = ai_explainer.explain_intent(intent_data)
    
    # 2. Store in memory
    audit_id = str(uuid.uuid4())
    intents_db[audit_id] = {
        "audit_id": audit_id,
        "action": req.action,
        "reason": req.reason,
        "amount": req.amount,
        "explanation": explanation_res.get("explanation"),
        "risk_score": explanation_res.get("risk_score"),
        "status": "pending",
        "tx_hash": None,
        "submitted_at": intent_data["timestamp"]
    }
    
    return intents_db[audit_id]

@app.get("/audit/pending")
def get_pending_intents():
    pending = [intent for intent in intents_db.values() if intent["status"] == "pending"]
    # Sort by newest first
    pending.sort(key=lambda x: x["submitted_at"], reverse=True)
    return {"pending_intents": pending, "total": len(pending)}

class VerifyIntentRequest(BaseModel):
    audit_id: str
    verifier_address: str = ""

@app.post("/audit/verify")
def verify_intent(req: VerifyIntentRequest):
    if req.audit_id not in intents_db:
        raise HTTPException(status_code=404, detail="Intent not found")
        
    intent = intents_db[req.audit_id]
    if intent["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Intent already {intent['status']}")
        
    try:
        # Trigger the actual execution on the HeLa blockchain!
        explanation_hash = intent.get("explanation", "")[:32] # Mock hash
        tx_hash = blockchain_service.log_decision(
            action=intent["action"],
            reason=intent["reason"],
            amount=intent["amount"],
            explanation_hash=explanation_hash,
            private_key=settings.PRIVATE_KEY
        )
        
        intent["status"] = "verified"
        intent["tx_hash"] = tx_hash
        intent["verified_by"] = req.verifier_address
        intent["verified_at"] = int(time.time())
        
        return {
            "success": True,
            "message": "Intent verified and executed on HeLa network",
            "audit_id": req.audit_id,
            "tx_hash": tx_hash,
            "hela_explorer_url": f"https://testnet-blockexplorer.helachain.com/tx/{tx_hash}"
        }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

