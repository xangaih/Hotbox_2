# prospector/instagram.py
# Stage A: Tavily search + fetch for Instagram profile data

from tavily import TavilyClient
import os

MIN_IG_TOKENS = 200  # below this = treat as low confidence


def scrape_instagram(username: str) -> dict:
    """
    Returns:
      {
        "raw_text": str,          # all scraped text concatenated
        "confidence": "high"|"medium"|"low",
        "token_count": int
      }
    """
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    raw_parts = []

    # Search pass — finds the profile page URL and gets snippets
    try:
        search_results = client.search(
            query=f"instagram.com/{username}",
            max_results=3,
            include_raw_content=False,
        )
        for r in search_results.get("results", []):
            if username.lower() in r.get("url", "").lower():
                raw_parts.append(r.get("content", ""))
    except Exception as e:
        print(f"  [instagram.py] search error: {e}")

    # Fetch pass — gets the actual profile page content
    try:
        fetch_result = client.extract(
            urls=[f"https://www.instagram.com/{username}/"],
        )
        for r in fetch_result.get("results", []):
            raw_parts.append(r.get("raw_content", ""))
    except Exception as e:
        print(f"  [instagram.py] fetch error: {e}")

    raw_text = "\n\n".join(filter(None, raw_parts))
    token_count = len(raw_text.split())

    if token_count >= MIN_IG_TOKENS:
        confidence = "high"
    elif token_count > 0:
        confidence = "low"
    else:
        confidence = "low"

    return {
        "raw_text": raw_text,
        "confidence": confidence,
        "token_count": token_count,
    }
