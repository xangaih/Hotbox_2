# prospector/prospector.py
# CLI entrypoint — called by server.py as a subprocess

import argparse
import json
import os
import sys
from pathlib import Path

# Make sure prospector package is importable
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "pipeline" / ".env")

from instagram import scrape_instagram
from escalation import scrape_escalation
from synthesizer import synthesize

PROSPECTED_PATH = Path(__file__).parent.parent / "prospected_leads.json"


def load_prospected() -> dict:
    if PROSPECTED_PATH.exists():
        try:
            return json.load(open(PROSPECTED_PATH))
        except Exception:
            return {}
    return {}


def save_prospected(data: dict):
    json.dump(data, open(PROSPECTED_PATH, "w"), indent=2)


def prospect_username(username: str):
    print(f"[prospector] Starting: @{username}")

    # Stage A — Instagram
    print(f"  [A] Scraping Instagram...")
    ig_result = scrape_instagram(username)
    print(f"  [A] Done. Confidence={ig_result['confidence']} tokens={ig_result['token_count']}")

    # Stage B — Escalation (always run to maximize data)
    print(f"  [B] Escalating to other platforms...")
    esc_result = scrape_escalation(username)
    print(f"  [B] Done. Sources found={esc_result['data_sources']}")

    # Stage C — Synthesize
    print(f"  [C] Synthesizing with Claude...")
    record = synthesize(username, ig_result, esc_result)
    print(f"  [C] Done. dataConfidence={record.get('dataConfidence')}")

    # Write to prospected_leads.json
    existing = load_prospected()
    existing[username] = record
    save_prospected(existing)

    print(f"[prospector] Complete. Written to prospected_leads.json")
    print(f"  dataConfidence={record.get('dataConfidence')}")
    print(f"  dataSource={record.get('dataSource')}")
    print(f"  summary={record.get('summary', '')[:80]}...")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True, help="Instagram username to prospect")
    args = parser.parse_args()
    prospect_username(args.username.lstrip("@"))
