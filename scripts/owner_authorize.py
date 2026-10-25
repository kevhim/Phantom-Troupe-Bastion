"""Independent Laptop B owner authorization. Never signs as ESP32.
The owner must inspect the exact intent, enter confirmation and provide their own
key via hidden input. No owner key is saved or transmitted to Laptop A.
"""
import argparse
import json
import sys
from getpass import getpass
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from eth_account import Account
from web3 import Web3
from services.device_crypto.crypto_engine import PaymentIntent, compute_eip712_digest, recover_signer, sign_payment_intent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--proof', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--rpc', default='http://127.0.0.1:8545')
    args = parser.parse_args()
    proof = json.loads(Path(args.proof).read_text(encoding='utf-8'))
    intent = PaymentIntent(**proof['intent'])
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root/'contracts/deployments.json').read_text())
    abi = json.loads((root/'schemas/contracts/BastionAccount.abi.json').read_text())
    w3 = Web3(Web3.HTTPProvider(args.rpc, request_kwargs={'timeout': 3}))
    if w3.eth.chain_id != 31337 or intent.verifyingAccount.lower() != manifest['bastionAccount'].lower():
        raise ValueError('Wrong chain or account')
    account = w3.eth.contract(address=manifest['bastionAccount'], abi=abi)
    expected_device = (account.functions.juniorExceptionSigner() if intent.approvalTier == 'JUNIOR_EXCEPTION'
                       else account.functions.seniorExceptionSigner()).call()
    if recover_signer(intent, proof['submission']['device_signature_hex']).lower() != expected_device.lower():
        raise ValueError('Device proof invalid')
    if intent.policyVersion != account.functions.policyVersion().call() or intent.deadline <= w3.eth.get_block('latest')['timestamp']:
        raise ValueError('Stale or expired intent; request new physical review')
    print(json.dumps(intent.to_dict(), indent=2))
    digest = Web3.to_hex(compute_eip712_digest(intent))
    print('Exact EIP-712 digest:', digest)
    if input('Type APPROVE followed by the full digest: ').strip() != 'APPROVE ' + digest:
        raise ValueError('Owner declined')
    key = getpass('Independent OWNER private key on Laptop B (hidden): ')
    if Account.from_key(key).address.lower() != account.functions.owner().call().lower():
        raise ValueError('Key is not the current owner')
    submission = dict(proof['submission'])
    submission['owner_signature_hex'] = sign_payment_intent(intent, key)
    del key
    Path(args.output).write_text(json.dumps(submission, indent=2), encoding='utf-8')
    print('Owner signature saved. Submit this public signature JSON via the live console. No payment executed yet.')

if __name__ == '__main__': main()
