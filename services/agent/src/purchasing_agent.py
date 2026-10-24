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
import httpx

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

    def submit_payment_request(
        self,
        payload: Dict[str, Any],
        timeout: float = 30.0,
    ) -> Dict[str, Any]:
        """
        Submits unsigned canonical payment request to Laptop A's FastAPI backend.
        Never marks payment successful from an API acknowledgement alone;
        verifies confirmed on-chain state (INCLUDED_SUCCESS).
        """
        url = f"{self.api_url}/payments/request"
        logger.info(f"Submitting payment request {payload.get('order_id')} to {url}...")

        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    status = data.get("status")
                    if status == "INCLUDED_SUCCESS":
                        logger.info(f"Payment {payload.get('order_id')} confirmed on-chain: tx={data.get('tx_hash')}")
                    elif status == "QUEUED_FOR_PHYSICAL_REVIEW":
                        logger.warning(f"Payment {payload.get('order_id')} queued for physical hardware review")
                    else:
                        logger.warning(f"Payment {payload.get('order_id')} result state: {status}")
                    return data
                elif resp.status_code == 403:
                    data = resp.json()
                    logger.error(f"Payment rejected by policy engine: {data.get('detail')}")
                    return {"status": "BLOCKED_POLICY_VIOLATION", "detail": data.get("detail")}
                else:
                    logger.error(f"Backend returned HTTP {resp.status_code}: {resp.text}")
                    return {"status": "UNKNOWN", "error": f"HTTP {resp.status_code}", "detail": resp.text}
        except httpx.RequestError as exc:
            logger.error(f"Network error submitting payment request: {exc}")
            return {"status": "UNKNOWN", "error": f"Network error: {str(exc)}"}

    def execute_purchase(
        self,
        recipient: str,
        amount_usd: float,
        description: str,
        prompt_context: Optional[str] = None,
        timeout: float = 30.0,
    ) -> Dict[str, Any]:
        """End-to-end execution: creates intent and submits to backend."""
        req = self.create_payment_request(
            recipient=recipient,
            amount_usd=amount_usd,
            description=description,
            prompt_context=prompt_context,
        )
        return self.submit_payment_request(req, timeout=timeout)


if __name__ == "__main__":
    agent = PurchasingAgent()
    req = agent.create_payment_request(
        recipient="0x00000000000000000000000000000000000000cc",
        amount_usd=25.0,
        description="Compute server reservation"
    )
    print(req)
