import { Lead, LeadType, BuyingIntent } from './types';
import ScoreBadge from './ScoreBadge';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}

const LEAD_TYPE_CLASSES: Record<LeadType, string> = {
  service_inquiry: 'bg-teal-100 text-teal-800',
  product_inquiry: 'bg-blue-100 text-blue-800',
  partnership: 'bg-purple-100 text-purple-800',
  spam: 'bg-red-100 text-red-800',
  unclear: 'bg-gray-100 text-gray-600',
};

const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  service_inquiry: 'Coaching',
  product_inquiry: 'Product',
  partnership: 'Partnership',
  spam: 'Spam',
  unclear: 'Unclear',
};

const INTENT_CLASSES: Record<BuyingIntent, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
};

export default function LeadCard({ lead, isSelected, onClick }: LeadCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate block">{lead.fullName}</span>
          <span className="text-xs text-gray-400 truncate block">@{lead.username}</span>
        </div>
        <ScoreBadge score={lead.qualityScore} size="sm" />
      </div>

      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{lead.summary}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAD_TYPE_CLASSES[lead.leadType]}`}>
          {LEAD_TYPE_LABELS[lead.leadType]}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTENT_CLASSES[lead.buyingIntent]}`}>
          {lead.buyingIntent} intent
        </span>
        {lead.enrichmentInfo.isVerified && (
          <span className="text-xs text-blue-500">✓ verified</span>
        )}
      </div>
    </button>
  );
}
