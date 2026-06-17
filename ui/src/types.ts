// types.ts

export type LeadType =
  | 'service_inquiry'
  | 'product_inquiry'
  | 'partnership'
  | 'spam'
  | 'unclear';

export type BuyingIntent = 'high' | 'medium' | 'low';

export type DmTone = 'genuine' | 'templated' | 'vague' | 'pushy';

export type FollowerTier = 'nano' | 'micro' | 'mid' | 'macro';

export type TriageTab =
  | 'important'
  | 'needs_reply'
  | 'all_others'
  | 'starred'
  | 'done'
  | 'cold_leads';

export type SortMode = 'priority' | 'recent';

export interface SuggestedReply {
  label: string;   // e.g. "Direct close"
  text: string;    // the full reply text
}

export interface EnrichmentInfo {
  // Stage 1 — extracted facts
  nicheAuthentic: boolean;
  nicheEvidence: string;
  serviceInquiry: boolean;
  productInquiry: boolean;
  partnershipPitch: boolean;
  painPointExpressed: boolean;
  painPointDetail: string;
  priceAwareness: boolean;
  audienceNicheMatch: boolean;
  followerTier: FollowerTier;
  engagementHealthy: boolean;
  dmTone: DmTone;
  spamSignals: string[];
  postContentSummary: string;

  // Stage 4 — computed by Python
  engagementRate: number;
  followerCount: number;
  isVerified: boolean;
  postCount: number;
  hasLinkInBio: boolean;
}

export interface Lead {
  username: string;

  // Stage 2 outputs — top-level for easy access
  qualityScore: number;           // 0-100
  summary: string;                // one sentence
  leadType: LeadType;
  buyingIntent: BuyingIntent;
  recommendedAction: string;
  scoringReasoning: string;

  // Triage state — set by pipeline, overridable by operator in UI
  triage: TriageTab;

  // Stage 3 outputs
  suggestedReplies: SuggestedReply[];

  // All enrichment detail
  enrichmentInfo: EnrichmentInfo;

  // Raw lead data (passed through for display)
  fullName: string;
  dm: string;
  recentPosts: RecentPost[];

  // Optional — only present on prospected cold leads
  isProspected?: boolean;
  dataSource?: string[];
  dataConfidence?: 'high' | 'medium' | 'low' | 'none';
}

export interface RecentPost {
  caption: string;
  imageDescription: string;
  likeCount: number;
  commentCount: number;
  postedAt: string;
}

// output.json is a Record<username, Lead>
export type OutputJson = Record<string, Omit<Lead, 'username'>>;

// After loading, we hydrate username into each lead object
// See App.tsx data loading section below
