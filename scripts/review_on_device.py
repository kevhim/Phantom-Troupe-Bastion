"""Laptop B only: relay unsigned intent to the sole ESP32, verify returned proof.
No device private keys, simulated RFID, or serial approval commands are supported.
"""
import argparse
import json
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import httpx
import serial
from services.device_crypto.crypto_engine import PaymentIntent, compute_eip712_digest, recover_signer
from web3 import Web3


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", required=True, help="Laptop A API origin, e.g. http://10.0.0.2:8000")
    parser.add_argument("--request-id", required=True)
    parser.add_argument("--port", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    response = httpx.get(args.api.rstrip('/') + '/api/v2/approvals/queue', timeout=5)
    response.raise_for_status()
    request = next(x for x in response.json() if x['request_id'] == args.request_id)
    intent = PaymentIntent(**request['intent'])
    manifest = json.loads((Path(__file__).resolve().parents[1] / 'contracts/deployments.json').read_text())
    if intent.verifyingAccount.lower() != manifest['bastionAccount'].lower() or intent.chainId != manifest['chainId']:
        raise ValueError('Intent does not match Laptop B deployment')
    expected = manifest['juniorSigner' if intent.approvalTier == 'JUNIOR_EXCEPTION' else 'seniorSigner']
    with serial.Serial(args.port, 115200, timeout=1) as device:
        time.sleep(2)  # USB-open reset; one process owns this port.
        device.reset_input_buffer()
        device.write((json.dumps({'action': 'SIGN_INTENT', 'intent': intent.to_dict()}) + '\n').encode())
        print('Review all OLED pages, scan the matching RFID card, then hold GPIO33 for 1.5 seconds.')
        started = time.monotonic()
        while time.monotonic() - started < 50:
            line = device.readline().decode(errors='replace').strip()
            if not line: continue
            try: event = json.loads(line)
            except ValueError: continue
            if event.get('error'): raise RuntimeError(event)
            if event.get('status') != 'APPROVED': continue
            if event.get('requestId') != intent.requestId or event.get('approvalTier') != intent.approvalTier:
                raise ValueError('Device proof binds a different request')
            if event.get('digest', '').lower() != Web3.to_hex(compute_eip712_digest(intent)).lower():
                raise ValueError('Device EIP-712 digest mismatch')
            if recover_signer(intent, event['deviceSignature']).lower() != expected.lower():
                raise ValueError('Unexpected device signer')
            proof = {'intent': intent.to_dict(), 'device_event': event,
                     'submission': {'request_id': intent.requestId, 'approval_tier': intent.approvalTier,
                                    'device_signature_hex': event['deviceSignature']}}
            Path(args.output).write_text(json.dumps(proof, indent=2), encoding='utf-8')
            print('Device signature verified. Owner authorization and blockchain execution are still pending.')
            return
    raise TimeoutError('No physical device approval received')

if __name__ == '__main__': main()
