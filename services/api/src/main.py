"""
Bastion X v2.1 — Main FastAPI Application Entrypoint (Laptop A)
Breach-Resilient AI Agent Wallet Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.api.src.routes.api_v2 import router as api_v2_router

app = FastAPI(
    title="Bastion X v2.1 API",
    description="Backend API for Breach-Resilient AI Agent Wallet with Hardware-Assisted Transaction Review",
    version="2.1.0",
)

# Enable CORS for React frontend on Laptop A (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v2_router)


@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Bastion X v2.1 API",
        "node": "Laptop A (RTX 5060)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.src.main:app", host="0.0.0.0", port=8000, reload=True)
