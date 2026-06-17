# prospector/synthesizer.py
# Stage C: Claude call to synthesize scraped data → leads.json schema

import json
import os
import anthropic
from prompts import SYNTHESIS_SYSTEM, SYNTHESIS_USER, LOW_CONFIDENCE_RECORD
from pathlib import Path

# Load business context so Claude knows what Apex Fuel sells
BUSINESS_PATH = Path(__file__).parent.parent / "business.json"

MIN_EVIDENCE_TOKENS = 100  # below this = low confidence, skip Claude call


def synthesize(
    username: str,
    instagram_result: dict,
    escalation_result: dict,
) -> dict:
    """
    Combines IG + escalation data, calls Claude, returns a
    leads.json-compatible record with extra prospector fields.
    """
    business = json.load(open(BUSINESS_PATH))

    ig_text = instagram_result.get("raw_text", "")
    esc_text = escalation_result.get("raw_text", "")
    data_sources = escalation_result.get("data_sources", [])

    # Count total evidence
    total_tokens = len(ig_text.split()) + len(esc_text.split())

    # Determine data_sources list (instagram always first if it had content)
    all_sources = []
    if instagram_result.get("token_count", 0) > 0:
        all_sources.append("instagram")
    all_sources.extend(data_sources)

    # Determine overall confidence
    if total_tokens >= MIN_EVIDENCE_TOKENS and instagram_result.get("confidence") == "high":
        data_confidence = "high"
    elif total_tokens >= MIN_EVIDENCE_TOKENS:
        data_confidence = "medium"
    elif total_tokens > 0:
        data_confidence = "low"
    else:
        data_confidence = "none"

    # If nothing found, return low-confidence record without calling Claude
    if data_confidence == "none" or total_tokens < 50:
        record = json.loads(
            LOW_CONFIDENCE_RECORD.format(username=username)
        )
        return record

    # Claude synthesis call
    client = anthropic.Anthropic()

    system = SYNTHESIS_SYSTEM.format(
        business_name=business["name"],
        offerings=business["offerings"],
        ideal_customer=business["idealCustomer"],
    )
    user = SYNTHESIS_USER.format(
        username=username,
        instagram_data=ig_text if ig_text else "No Instagram data found.",
        escalation_data=esc_text if esc_text else "No escalation data found.",
        data_sources=", ".join(all_sources) if all_sources else "none",
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1200,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        raw = response.content[0].text.strip()

        # Strip markdown code fences if Claude wrapped the JSON
        if raw.startswith("```"):
            lines = raw.splitlines()
            # Drop the opening fence line and any closing fence
            inner = [l for l in lines if not l.startswith("```")]
            raw = "\n".join(inner).strip()

        record = json.loads(raw)
    except Exception as e:
        print(f"  [synthesizer.py] Claude error: {e}")
        print(f"  [synthesizer.py] Raw response was: {repr(raw[:300]) if 'raw' in dir() else '(no response)'}")
        record = json.loads(LOW_CONFIDENCE_RECORD.format(username=username))
        data_confidence = "low"

    # Inject computed enrichment fields Claude can't know
    record["enrichmentInfo"]["engagementRate"] = 0.0
    record["enrichmentInfo"]["followerCount"] = record["enrichmentInfo"].get("followerCount", 0)
    record["enrichmentInfo"]["isVerified"] = False
    record["enrichmentInfo"]["postCount"] = 0
    record["enrichmentInfo"]["hasLinkInBio"] = False

    # Inject prospector metadata
    record["isProspected"] = True
    record["dataSource"] = all_sources
    record["dataConfidence"] = data_confidence
    record["triage"] = "cold_leads"
    record["dm"] = "[PROSPECTED — cold lead, no DM]"
    record["suggestedReplies"] = []

    return record
