import { useState } from 'react';
import { Lead, LeadType, BuyingIntent, DmTone, TriageTab } from './types';
import ScoreBadge from './ScoreBadge';

interface LeadDetailProps {
  lead: Lead;
  onTriageChange: (triage: TriageTab) => void;
}

const LEAD_TYPE_CLASSES: Record<LeadType, string> = {
  service_inquiry: 'bg-teal-100 text-teal-800',
  product_inquiry: 'bg-blue-100 text-blue-800',
  partnership: 'bg-purple-100 text-purple-800',
  spam: 'bg-red-100 text-red-800',
  unclear: 'bg-gray-100 text-gray-600',
};

const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  service_inquiry: 'Coaching inquiry',
  product_inquiry: 'Product inquiry',
  partnership: 'Partnership',
  spam: 'Spam',
  unclear: 'Unclear',
};

const INTENT_CLASSES: Record<BuyingIntent, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
};

const DM_TONE_CLASSES: Record<DmTone, string> = {
  genuine: 'bg-green-50 text-green-700',
  templated: 'bg-amber-50 text-amber-700',
  vague: 'bg-gray-50 text-gray-600',
  pushy: 'bg-red-50 text-red-700',
};

const TRIAGE_ACTIONS: { id: TriageTab; label: string; emoji: string }[] = [
  { id: 'starred', label: 'Star', emoji: '⭐' },
  { id: 'done', label: 'Done', emoji: '✓' },
  { id: 'important', label: 'Important', emoji: '🔴' },
  { id: 'needs_reply', label: 'Needs Reply', emoji: '💬' },
  { id: 'all_others', label: 'Archive', emoji: '📁' },
];

function BooleanPill({ value, trueLabel, falseLabel }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {value ? (trueLabel ?? 'Yes') : (falseLabel ?? 'No')}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{children}</h3>
  );
}

export default function LeadDetail({ lead, onTriageChange }: LeadDetailProps) {
  const [selectedReplyIdx, setSelectedReplyIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const ei = lead.enrichmentInfo;

  function copyReply(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Lead header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-gray-900">{lead.fullName}</h2>
            {ei.isVerified && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">@{lead.username}</p>
        </div>
        <ScoreBadge score={lead.qualityScore} size="md" />
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{lead.summary}</p>

      {/* Type + intent badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEAD_TYPE_CLASSES[lead.leadType]}`}>
          {LEAD_TYPE_LABELS[lead.leadType]}
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${INTENT_CLASSES[lead.buyingIntent]}`}>
          {lead.buyingIntent} intent
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DM_TONE_CLASSES[ei.dmTone]}`}>
          {ei.dmTone} tone
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
          {ei.followerTier} tier · {ei.followerCount.toLocaleString()} followers
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
          {ei.engagementRate}% engagement
        </span>
      </div>

      {/* Triage controls */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TRIAGE_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => onTriageChange(action.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              lead.triage === action.id
                ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {action.emoji} {action.label}
          </button>
        ))}
      </div>

      {/* Recommended action */}
      <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg px-4 py-3 mb-8">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Recommended Action</p>
        <p className="text-sm text-blue-900">{lead.recommendedAction}</p>
      </div>

      {/* Scoring reasoning */}
      <section className="mb-8">
        <SectionHeading>Scoring Reasoning</SectionHeading>
        <p className="text-sm text-gray-700 leading-relaxed">{lead.scoringReasoning}</p>
      </section>

      {/* Original DM */}
      <section className="mb-8">
        <SectionHeading>Original DM</SectionHeading>
        <blockquote className="text-sm text-gray-800 bg-gray-50 rounded-lg px-4 py-3 leading-relaxed border-l-2 border-gray-300 italic">
          "{lead.dm}"
        </blockquote>
      </section>

      {/* Suggested replies */}
      {lead.suggestedReplies.length > 0 && (
        <section className="mb-8">
          <SectionHeading>Suggested Replies</SectionHeading>
          <div className="flex flex-col gap-3">
            {lead.suggestedReplies.map((reply, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedReplyIdx(idx === selectedReplyIdx ? null : idx)}
                className={`border rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors ${
                  selectedReplyIdx === idx ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">{reply.label}</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{reply.text}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyReply(reply.text, idx); }}
                    className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-0.5"
                    title="Copy to clipboard"
                  >
                    {copiedIdx === idx ? '✓' : 'copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Enrichment details */}
      <section className="mb-8">
        <SectionHeading>Enrichment Details</SectionHeading>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-xs text-gray-400 block mb-1">Niche authentic</span>
            <BooleanPill value={ei.nicheAuthentic} />
            {ei.nicheEvidence && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ei.nicheEvidence}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Audience niche match</span>
            <BooleanPill value={ei.audienceNicheMatch} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Pain point expressed</span>
            <BooleanPill value={ei.painPointExpressed} />
            {ei.painPointDetail && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ei.painPointDetail}</p>
            )}
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Price awareness</span>
            <BooleanPill value={ei.priceAwareness} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Engagement healthy</span>
            <BooleanPill value={ei.engagementHealthy} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Has link in bio</span>
            <BooleanPill value={ei.hasLinkInBio} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Inquiries</span>
            <div className="flex gap-1 flex-wrap mt-1">
              {ei.serviceInquiry && (
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">Coaching</span>
              )}
              {ei.productInquiry && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Product</span>
              )}
              {ei.partnershipPitch && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Partnership</span>
              )}
              {!ei.serviceInquiry && !ei.productInquiry && !ei.partnershipPitch && (
                <span className="text-xs text-gray-400">None detected</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-1">Post count</span>
            <span className="text-sm text-gray-700">{ei.postCount}</span>
          </div>
        </div>

        {ei.postContentSummary && (
          <div className="mt-4">
            <span className="text-xs text-gray-400 block mb-1">Post content summary</span>
            <p className="text-sm text-gray-700">{ei.postContentSummary}</p>
          </div>
        )}

        {ei.spamSignals.length > 0 && (
          <div className="mt-4">
            <span className="text-xs text-gray-400 block mb-1">Spam signals</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ei.spamSignals.map((signal, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recent posts */}
      {lead.recentPosts.length > 0 && (
        <section className="mb-8">
          <SectionHeading>Recent Posts</SectionHeading>
          <div className="flex flex-col gap-3">
            {lead.recentPosts.map((post, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-800 mb-1 leading-relaxed">{post.caption}</p>
                <p className="text-xs text-gray-400 italic mb-2">{post.imageDescription}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>♥ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                  <span>{post.postedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
