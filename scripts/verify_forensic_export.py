"""Verify an exported full event chain against a checkpoint fetched from Laptop B."""
import argparse
import json
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import httpx
from services.api.src.evidence.flight_recorder import FlightRecorder, ForensicEvent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--export', required=True)
    parser.add_argument('--supervisor', required=True)
    parser.add_argument('--checkpoint', required=True)
    args = parser.parse_args()
    report = json.loads(Path(args.export).read_text(encoding='utf-8'))
    response = httpx.get(args.supervisor.rstrip('/') + '/supervisor/audit/checkpoint/' + args.checkpoint,
        headers={'Authorization': 'Bearer ' + os.environ['CHECKPOINT_TOKEN']}, timeout=5)
    response.raise_for_status()
    checkpoint = response.json()
    recorder = FlightRecorder(auto_persist_db=False)
    recorder.events = [ForensicEvent(**event) for event in report['verification_events']]
    valid, message, _ = recorder.verify_event_chain(recorder.events)
    if not valid: raise ValueError(message)
    valid, message = recorder.verify_against_checkpoint(checkpoint)
    if not valid: raise ValueError(message)
    print('VERIFIED against independently retrieved checkpoint:', args.checkpoint)
    print('Anchored events:', checkpoint['event_count'], 'Total exported:', len(recorder.events))
    if checkpoint['event_count'] < len(recorder.events):
        print('Events after the checkpoint are internally linked but not independently anchored.')

if __name__ == '__main__': main()
