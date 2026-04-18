import requests
import time

def populate_intents():
    decisions = [
        ("swap ETH to USDC", "Market volatility detected, reducing ETH exposure by 15%", 500),
        ("stake 10 HELA tokens", "Staking APY at 12.4%, optimal compounding window identified", 10),
        ("vote YES on Proposal #42", "Proposal improves protocol security, risk model approves", 0)
    ]

    print("Submitting experimental intents to the Command Center Interceptor...\n")
    
    for action, reason, amount in decisions:
        print(f"Generating Intent: {action}")
        payload = {
            "action": action,
            "reason": reason,
            "amount": amount
        }
        
        try:
            # We hit the Python backend so Gemini can generate the Explanation & Risk Score
            response = requests.post("http://localhost:8000/audit/submit-intent", json=payload)
            if response.status_code == 200:
                data = response.json()
                print(f"SUCCESS. Intent created! AI Assessment Risk: {data['risk_score']}/10")
            else:
                print(f"FAILED: {response.text}")
        except Exception as e:
            print(f"Error connecting to local server: {e} (make sure uvicorn is running!)")
            
        print("-" * 40)
        time.sleep(2)  # Give the rate-limits a breather

if __name__ == "__main__":
    populate_intents()
