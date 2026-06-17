# prospector/escalation.py
# Stage B: Try LinkedIn, X, YouTube, Google if IG was thin

from tavily import TavilyClient
import os


def scrape_escalation(username: str, full_name: str = "") -> dict:
    """
    Tries platforms in order. Returns whatever was found.
    Returns:
      {
        "raw_text": str,         # concatenated text from all platforms
        "data_sources": list[str]  # which platforms returned something
      }
    """
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    results = []
    data_sources = []
    search_name = full_name if full_name else username

    platforms = [
        {
            "name": "linkedin",
            "query": f'"{search_name}" site:linkedin.com/in',
        },
        {
            "name": "twitter",
            "query": f'"{username}" site:x.com',
        },
        {
            "name": "youtube",
            "query": f'"{username}" site:youtube.com',
        },
        {
            "name": "google",
            "query": f'"{username}" fitness trainer linktree OR beacons OR about.me',
        },
    ]

    for platform in platforms:
        try:
            search_results = client.search(
                query=platform["query"],
                max_results=2,
                include_raw_content=False,
            )
            platform_text = []
            for r in search_results.get("results", []):
                content = r.get("content", "").strip()
                if content and len(content.split()) > 20:
                    platform_text.append(content)

            if platform_text:
                combined = "\n".join(platform_text)
                results.append(f"[{platform['name'].upper()}]\n{combined}")
                data_sources.append(platform["name"])

        except Exception as e:
            print(f"  [escalation.py] {platform['name']} error: {e}")

    return {
        "raw_text": "\n\n".join(results),
        "data_sources": data_sources,
    }
