# Agentic Protocol - Backend

An accountability and audit layer for autonomous AI agents on the HeLa blockchain. Every agent decision is logged immutably, humans can read each decision, get an AI explanation in plain English, and challenge suspicious decisions within a 1-hour window.

## Prerequisites
- Python 3.11+
- pip
- MetaMask with HeLa testnet configured

## Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment template:
   ```bash
   cp .env.example .env
   ```

## Environment Setup
Edit the `.env` file and fill in required values.
You can get a `GOOGLE_API_KEY` for Gemini from [Google AI Studio](https://aistudio.google.com).

## How to Run

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

## How to Run Mock Agent

To populate the smart contract with dummy agent actions, run:
```bash
python mock_agent.py
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check + blockchain connection status |
| GET | `/decisions` | List all logged decisions |
| GET | `/decisions/{id}` | Get a specific decision by ID |
| GET | `/explain/{id}` | Get AI explanation for decision using Gemini |
| POST | `/explain/batch` | Get AI explanations for multiple decisions |
| POST | `/challenge/{id}` | Validate if decision is challengeable |
| GET | `/challenge/{id}/status` | Get current status and challenge window |
| POST | `/agent/trigger` | Manually log a decision via API (Mock) |

## Tools & Tech Stack
- **LangChain** + **Google Gemini (gemini-1.5-flash)** for AI Explainability
- **Web3.py** for interacting with HeLa Blockchain
- **FastAPI** for high-performance API routing

| Technology | Purpose |
|---|---|
| Python 3.11 | Core Language |
| FastAPI | Backend Web Framework |
| Web3.py | Blockchain Interaction (HeLa EVM) |
| LangChain | LLM Orchestration |
| Gemini API | Natural Language Explanations |
| Pydantic v2 | Data Validation & Settings |
