# enricher.py
from statistics import mean


def assign_triage(quality_score: int) -> str:
    """
    Maps quality score to the default triage tab.
    Operator can override this in the UI (stored in localStorage).
    """
    if quality_score >= 70:
        return 'important'
    elif quality_score >= 40:
        return 'needs_reply'
    else:
        return 'all_others'


def compute_engagement_rate(lead: dict) -> float:
    """
    Engagement rate = (avg likes + avg comments) / follower count * 100.
    Clamped to 2 decimal places. Returns 0.0 if no posts or followers.

    Healthy benchmarks by tier:
      nano  (< 1k followers):  5-10% is normal
      micro (1k-50k):          2-5%
      mid   (50k-500k):        1-3%
      macro (500k+):           0.5-1.5%
    """
    posts = lead.get('recentPosts', [])
    followers = lead.get('followerCount', 0)
    if not posts or not followers:
        return 0.0
    avg_likes    = mean(p.get('likeCount', 0)    for p in posts)
    avg_comments = mean(p.get('commentCount', 0) for p in posts)
    return round((avg_likes + avg_comments) / followers * 100, 2)


def compute_follower_tier(follower_count: int) -> str:
    """
    Standard creator tier definitions.
    Stage 1 also produces followerTier via Claude — this is the
    deterministic version that overrides it for consistency.
    """
    if follower_count < 1_000:
        return 'nano'
    elif follower_count < 50_000:
        return 'micro'
    elif follower_count < 500_000:
        return 'mid'
    else:
        return 'macro'


def enrich(
    lead: dict,
    stage1: dict,
    stage2: dict,
    stage3: dict,
) -> dict:
    quality_score = stage2.get('qualityScore', 0)
    followers     = lead.get('followerCount', 0)

    # Override Claude's followerTier with the deterministic version
    stage1['followerTier'] = compute_follower_tier(followers)

    return {
        # ── Stage 2 — top-level scoring fields ──────────────────────
        'qualityScore':      quality_score,
        'summary':           stage2.get('summary', ''),
        'leadType':          stage2.get('leadType', 'unclear'),
        'buyingIntent':      stage2.get('buyingIntent', 'low'),
        'recommendedAction': stage2.get('recommendedAction', ''),
        'scoringReasoning':  stage2.get('scoringReasoning', ''),

        # ── Triage — Python-computed from score ──────────────────────
        'triage': assign_triage(quality_score),

        # ── Stage 3 — reply drafts ───────────────────────────────────
        'suggestedReplies': stage3.get('suggestedReplies', []),

        # ── Enrichment detail — Stage 1 facts + Stage 4 computed ─────
        'enrichmentInfo': {
            # Stage 1 extracted facts
            'nicheAuthentic':     stage1.get('nicheAuthentic', False),
            'nicheEvidence':      stage1.get('nicheEvidence', ''),
            'serviceInquiry':     stage1.get('serviceInquiry', False),
            'productInquiry':     stage1.get('productInquiry', False),
            'partnershipPitch':   stage1.get('partnershipPitch', False),
            'painPointExpressed': stage1.get('painPointExpressed', False),
            'painPointDetail':    stage1.get('painPointDetail', ''),
            'priceAwareness':     stage1.get('priceAwareness', False),
            'audienceNicheMatch': stage1.get('audienceNicheMatch', False),
            'followerTier':       stage1['followerTier'],   # deterministic
            'engagementHealthy':  stage1.get('engagementHealthy', False),
            'dmTone':             stage1.get('dmTone', 'genuine'),
            'spamSignals':        stage1.get('spamSignals', []),
            'postContentSummary': stage1.get('postContentSummary', ''),

            # Stage 4 computed — deterministic Python
            'engagementRate': compute_engagement_rate(lead),
            'followerCount':  followers,
            'isVerified':     lead.get('isVerified', False),
            'postCount':      lead.get('postCount', 0),
            'hasLinkInBio':   bool(lead.get('linkInBio', '')),
        },

        # ── Raw lead data — passed through for UI display ────────────
        'fullName':    lead.get('fullName', lead.get('username', '')),
        'dm':          lead.get('dm', ''),
        'recentPosts': lead.get('recentPosts', []),
    }
