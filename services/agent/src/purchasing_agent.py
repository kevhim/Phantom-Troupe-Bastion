"""
BASTION X v2.2 — AI Purchasing Agent
Host Machine: Laptop A (NVIDIA RTX 5060)
Responsibilities:
- Parses autonomous user procurement intents into structured payment requests.
- Submits unsigned canonical payment payloads to Laptop A's FastAPI backend.
- Strictly isolated from private keys and hardware signing keys.
"""

from typing import Dict, Any, Optional
import time
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("purchasing_agent")


class PurchasingAgent:
    def __init__(self, api_url: str = "http://127.0.0.1:8000/api/v2"):
        self.api_url = api_url
        self.session_id = f"agent-session-{uuid.uuid4().hex[:8]}"

    def create_payment_request(
        self,
        recipient: str,
        amount_usd: float,
        description: str,
        prompt_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a structured payment intent request.
        Converts human USD amount to 6-decimal base units (bUSD).
        """
        amount_base_units = int(amount_usd * 10**6)
        order_id = f"ORD-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"

        payload = {
            "recipient": recipient,
            "amount": amount_base_units,
            "order_id": order_id,
            "prompt_context": prompt_context or f"Autonomous purchase: {description}",
        }
        logger.info(f"Agent generated payment request: {order_id} for ${amount_usd:.2f} ({amount_base_units} bUSD)")
        return payload


if __name__ == "__main__":
    agent = PurchasingAgent()
    req = agent.create_payment_request(
        recipient="0x00000000000000000000000000000000000000cc",
        amount_usd=25.0,
        description="Compute server reservation"
    )
    print(req)
