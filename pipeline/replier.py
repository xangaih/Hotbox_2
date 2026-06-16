# replier.py
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

import anthropic
from prompts import REPLY_SYSTEM, REPLY_USER
from utils import parse_json_response


def generate_replies(
    lead: dict,
    stage1: dict,
    stage2: dict,
    business: dict,
) -> dict:
    client = anthropic.Anthropic()
    system = REPLY_SYSTEM.format(
        business_name=business['name'],
        business_description=business['description'],
        offerings=business['offerings'],
        dm_tone=stage1.get('dmTone', 'genuine'),
    )
    user = REPLY_USER.format(
        summary=stage2['summary'],
        lead_type=stage2['leadType'],
        pain_point=stage1.get('painPointDetail', 'not specified'),
        recommended_action=stage2['recommendedAction'],
        dm=lead['dm'],
    )

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=800,
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
            max_tokens=800,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        )
        result = parse_json_response(response.content[0].text)

    except anthropic.APIError as e:
        print(f"  [api error] {e}")
        raise

    # Guarantee the key exists and has exactly 3 replies
    replies = result.get('suggestedReplies', [])
    while len(replies) < 3:
        replies.append({
            'label': 'Alternative',
            'text': stage2.get('recommendedAction', '')
        })
    result['suggestedReplies'] = replies[:3]

    return result
