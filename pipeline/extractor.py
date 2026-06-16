# extractor.py
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

import anthropic
from prompts import EXTRACTION_SYSTEM, EXTRACTION_USER
from utils import parse_json_response


def format_posts(posts: list) -> str:
    lines = []
    for i, p in enumerate(posts, 1):
        lines.append(
            f"Post {i} ({p['postedAt']}): {p['caption']}\n"
            f"  Image: {p['imageDescription']}\n"
            f"  Likes: {p['likeCount']} | Comments: {p['commentCount']}"
        )
    return '\n\n'.join(lines)


def extract(lead: dict, business: dict) -> dict:
    client = anthropic.Anthropic()
    system = EXTRACTION_SYSTEM.format(
        business_name=business['name'],
        offerings=business['offerings'],
        ideal_customer=business['idealCustomer'],
        common_spam=business['commonSpam'],
    )
    user = EXTRACTION_USER.format(
        username=lead['username'],
        full_name=lead['fullName'],
        bio=lead['bio'],
        follower_count=lead['followerCount'],
        following_count=lead['followingCount'],
        is_verified=lead['isVerified'],
        link_in_bio=lead.get('linkInBio', ''),
        recent_posts=format_posts(lead['recentPosts']),
        dm=lead['dm'],
    )

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1000,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        )
        return parse_json_response(response.content[0].text)

    except ValueError as e:
        print(f"  [parse error] {e}")
        raise

    except anthropic.RateLimitError:
        import time
        print("  [rate limit] waiting 10s...")
        time.sleep(10)
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1000,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        )
        return parse_json_response(response.content[0].text)

    except anthropic.APIError as e:
        print(f"  [api error] {e}")
        raise
