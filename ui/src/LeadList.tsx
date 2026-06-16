import { Lead, TriageTab, SortMode } from './types';
import LeadCard from './LeadCard';

interface LeadListProps {
  leads: Lead[];
  activeTab: TriageTab;
  sortMode: SortMode;
  selectedUsername: string | null;
  onSelectLead: (username: string) => void;
  onSortChange: (mode: SortMode) => void;
}

function filterLeads(leads: Lead[], activeTab: TriageTab): Lead[] {
  if (activeTab === 'starred' || activeTab === 'done') {
    return leads.filter(l => l.triage === activeTab);
  }
  return leads.filter(l => {
    if (l.triage === 'starred' || l.triage === 'done') return false;
    return l.triage === activeTab;
  });
}

function sortLeads(leads: Lead[], sortBy: SortMode): Lead[] {
  if (sortBy === 'priority') {
    return [...leads].sort((a, b) => b.qualityScore - a.qualityScore);
  }
  return leads;
}

export default function LeadList({
  leads,
  activeTab,
  sortMode,
  selectedUsername,
  onSelectLead,
  onSortChange,
}: LeadListProps) {
  const filtered = filterLeads(leads, activeTab);
  const sorted = sortLeads(filtered, sortMode);

  return (
    <aside className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Sort controls */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{sorted.length} leads</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
          {(['priority', 'recent'] as SortMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onSortChange(mode)}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                sortMode === mode
                  ? 'bg-white text-gray-900 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'priority' ? 'Priority' : 'Recent'}
            </button>
          ))}
        </div>
      </div>

      {/* Lead cards */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No leads here</p>
          </div>
        ) : (
          sorted.map(lead => (
            <LeadCard
              key={lead.username}
              lead={lead}
              isSelected={lead.username === selectedUsername}
              onClick={() => onSelectLead(lead.username)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
