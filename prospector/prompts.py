# prospector/prompts.py

SYNTHESIS_SYSTEM = """You are building a lead profile record for a fitness business.

Business: {business_name}
What they sell: {offerings}
Their ideal customer: {ideal_customer}

You have been given raw scraped data from public social media profiles.
This person has NOT messaged the business. This is a cold lead.

Your job: synthesize all available data into a structured lead profile.
Be accurate. Do not invent details not present in the scraped data.
If a field cannot be determined from the data, use the default value specified.

Return raw JSON only — no markdown, no code fences, no preamble."""

SYNTHESIS_USER = """Instagram username: {username}

Raw scraped data from public sources:
--- INSTAGRAM ---
{instagram_data}

--- ESCALATION SOURCES ---
{escalation_data}

Data sources that returned results: {data_sources}

Synthesize this into the following JSON structure.
Use empty string "" for unknown text fields.
Use false for unknown boolean fields.
Use 0 for unknown numeric fields.

{{
  "qualityScore": 0,
  "summary": "one sentence: who this person appears to be based on their public profile",
  "leadType": "unclear",
  "buyingIntent": "low",
  "recommendedAction": "specific suggestion for cold outreach based on their apparent niche/interest",
  "scoringReasoning": "2 sentences: what the public data tells us about fit with the business",
  "triage": "cold_leads",
  "suggestedReplies": [],
  "enrichmentInfo": {{
    "nicheAuthentic": bool,
    "nicheEvidence": "what content topics suggest about their niche",
    "serviceInquiry": false,
    "productInquiry": false,
    "partnershipPitch": false,
    "painPointExpressed": bool,
    "painPointDetail": "any pain points visible in bio or posts",
    "priceAwareness": false,
    "audienceNicheMatch": bool,
    "followerTier": "nano|micro|mid|macro",
    "engagementHealthy": bool,
    "dmTone": "genuine",
    "spamSignals": [],
    "postContentSummary": "summary of what their posts are about"
  }},
  "fullName": "their full name or empty string",
  "dm": "[PROSPECTED — cold lead, no DM]",
  "recentPosts": []
}}"""

LOW_CONFIDENCE_RECORD = """{{
  "qualityScore": 0,
  "summary": "Insufficient public data found for @{username} across Instagram, LinkedIn, X, and YouTube. Profile may be fully private or username may be incorrect.",
  "leadType": "unclear",
  "buyingIntent": "low",
  "recommendedAction": "Manual lookup required — no usable public data was found.",
  "scoringReasoning": "Prospector returned below minimum evidence threshold across all platforms.",
  "triage": "cold_leads",
  "suggestedReplies": [],
  "enrichmentInfo": {{
    "nicheAuthentic": false,
    "nicheEvidence": "",
    "serviceInquiry": false,
    "productInquiry": false,
    "partnershipPitch": false,
    "painPointExpressed": false,
    "painPointDetail": "",
    "priceAwareness": false,
    "audienceNicheMatch": false,
    "followerTier": "nano",
    "engagementHealthy": false,
    "dmTone": "genuine",
    "spamSignals": [],
    "postContentSummary": "",
    "engagementRate": 0.0,
    "followerCount": 0,
    "isVerified": false,
    "postCount": 0,
    "hasLinkInBio": false
  }},
  "fullName": "{username}",
  "dm": "[PROSPECTED — cold lead, no DM]",
  "recentPosts": [],
  "isProspected": true,
  "dataSource": [],
  "dataConfidence": "none"
}}"""
