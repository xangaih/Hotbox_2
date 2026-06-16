# scorer.py
import json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

import anthropic
from prompts import SCORING_SYSTEM, SCORING_USER
from utils import parse_json_response


def score(lead: dict, stage1: dict, business: dict) -> dict:
    client = anthropic.Anthropic()
    system = SCORING_SYSTEM.format(
        business_name=business['name'],
        goals=business['goals'],
        ideal_customer=business['idealCustomer'],
        offerings=business['offerings'],
        common_spam=business['commonSpam'],
    )
    user = SCORING_USER.format(
        stage1_json=json.dumps(stage1, indent=2),
        dm=lead['dm'],
    )

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=600,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        )
        result = parse_json_response(response.content[0].text)

    except ValueError as e:
        print(f"  [parse error] {e}")
        raise

    except anthropic.RateLimitError:
        import time
        print("  [rate limit] waiting 10s...")
        time.sleep(10)
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=600,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        )
        result = parse_json_response(response.content[0].text)

    except anthropic.APIError as e:
        print(f"  [api error] {e}")
        raise

    # Validate qualityScore is actually an int in range
    score_val = result.get('qualityScore', 0)
    if not isinstance(score_val, int):
        result['qualityScore'] = int(score_val)
    result['qualityScore'] = max(0, min(100, result['qualityScore']))

    # Guarantee all keys exist with safe defaults
    result.setdefault('summary', '')
    result.setdefault('leadType', 'unclear')
    result.setdefault('buyingIntent', 'low')
    result.setdefault('recommendedAction', '')
    result.setdefault('scoringReasoning', '')

    return result
