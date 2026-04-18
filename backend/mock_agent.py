import time
import os
import json
from dotenv import load_dotenv
from web3 import Web3

def run_mock_agent(agent_name="Agent-Alpha"):
    load_dotenv()
    
    rpc_url = os.getenv("HELA_RPC", "https://testnet-rpc.helachain.com")
    private_key = os.getenv("PRIVATE_KEY")
    contract_address = os.getenv("CONTRACT_ADDRESS")
    
    if not private_key or not contract_address:
        print("Error: PRIVATE_KEY or CONTRACT_ADDRESS missing from .env")
        return
        
    print(f"[{agent_name}] Connecting to HeLa Testnet at {rpc_url}...")
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    if not w3.is_connected():
        print(f"[{agent_name}] Failed to connect to blockchain.")
        return
        
    print(f"[{agent_name}] Connected! Chain ID: {w3.eth.chain_id}")
    
    with open("abi.json", "r") as f:
        abi = json.load(f)
        
    contract = w3.eth.contract(address=contract_address, abi=abi)
    account = w3.eth.account.from_key(private_key)
    
    decisions = [
        ("swap ETH to USDC", "Market volatility detected, reducing ETH exposure by 15%", 500),
        ("stake 10 HELA tokens", "Staking APY at 12.4%, optimal compounding window identified", 10),
        ("vote YES on Proposal #42", "Proposal improves protocol security, risk model approves", 0),
        ("transfer 5 USDC to treasury", "Monthly protocol fee collection - scheduled action", 5),
        ("withdraw LP position", "Impermanent loss exceeds 8% threshold, exiting position", 100),
        ("purchase ETH on price dip", "RSI dropped below 28, historical buy signal confirmed", 200)
    ]
    
    for action, reason, amount in decisions:
        print(f"\n[{agent_name}] Submitting decision: {action}")

        # Always fetch fresh nonce from chain — prevents invalid nonce on rapid submissions
        nonce = w3.eth.get_transaction_count(account.address, 'pending')
        
        # The 4th argument `_explanationHash` is mandatory per the contract ABI
        explanation_hash = f"{agent_name}::{action[:20]}"
        
        try:
            tx = contract.functions.logDecision(action, reason, amount, explanation_hash).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 500000,
                'gasPrice': w3.eth.gas_price
            })
            
            signed_tx = w3.eth.account.sign_transaction(tx, private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            hex_hash = w3.to_hex(tx_hash)
            
            print(f"[{agent_name}] Tx submitted: {hex_hash}")
            print(f"[{agent_name}] Waiting for confirmation...")

            # Wait for the transaction to be mined before submitting the next one
            # This guarantees the nonce is always valid for sequential submissions
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                print(f"[{agent_name}] CONFIRMED! Block #{receipt.blockNumber}")
                print(f"[{agent_name}] Explorer: https://testnet-scan.helachain.com/tx/{hex_hash}")
            else:
                print(f"[{agent_name}] Transaction REVERTED on-chain. Skipping.")
                
        except Exception as e:
            print(f"[{agent_name}] Error on decision '{action}': {e}")
            # On failure, pause before retrying the next item to avoid cascading errors
            time.sleep(5)
            continue

if __name__ == "__main__":
    run_mock_agent(agent_name="Agent-Alpha")
