# run.py
import json
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

from extractor import extract
from scorer    import score
from replier   import generate_replies
from enricher  import enrich

# ── Tune this to control parallelism ────────────────────────────────────────
# 10  = fastest (~1 min for 25 leads), higher chance of rate limit
# 5   = safe middle ground (~2 min)
# 3   = conservative, good for budget/free API keys
# 1   = fully sequential (original behaviour)
MAX_WORKERS = 10
# ─────────────────────────────────────────────────────────────────────────────


def process_lead(lead: dict, business: dict, index: int, total: int) -> tuple[str, dict]:
    username = lead['username']
    print(f"[{index}/{total}] Processing {username}...")
    try:
        stage1 = extract(lead, business)
        stage2 = score(lead, stage1, business)
        stage3 = generate_replies(lead, stage1, stage2, business)
        result = enrich(lead, stage1, stage2, stage3)
        print(f"  ✓ {username} score={result['qualityScore']} triage={result['triage']}")
        return username, result
    except Exception as e:
        print(f"  ✗ {username} failed: {e}")
        return username, {
            'qualityScore': 0,
            'summary': f'Pipeline error: {e}',
            'leadType': 'unclear',
            'buyingIntent': 'low',
            'recommendedAction': 'Re-run pipeline for this lead.',
            'scoringReasoning': 'Pipeline error — no score available.',
            'triage': 'all_others',
            'suggestedReplies': [],
            'enrichmentInfo': {},
            'fullName': lead.get('fullName', username),
            'dm': lead.get('dm', ''),
            'recentPosts': lead.get('recentPosts', []),
        }


def run_pipeline(leads_path: str, business_path: str, out_path: str):
    leads    = json.load(open(leads_path))
    business = json.load(open(business_path))
    total    = len(leads)

    print(f"Starting pipeline: {total} leads, {MAX_WORKERS} workers")

    output = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {
            pool.submit(process_lead, lead, business, i + 1, total): lead['username']
            for i, lead in enumerate(leads)
        }
        for future in as_completed(futures):
            username, result = future.result()
            output[username] = result

    # Write in the original leads.json order so the UI stays stable
    ordered = {lead['username']: output[lead['username']] for lead in leads}
    json.dump(ordered, open(out_path, 'w'), indent=2)
    print(f"\nDone. {total} leads written to {out_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--leads',    default='../leads.json')
    parser.add_argument('--business', default='../business.json')
    parser.add_argument('--out',      default='output.json')
    parser.add_argument('--workers',  type=int, default=MAX_WORKERS,
                        help='Number of parallel workers (default: MAX_WORKERS)')
    args = parser.parse_args()
    MAX_WORKERS = args.workers
    run_pipeline(args.leads, args.business, args.out)
