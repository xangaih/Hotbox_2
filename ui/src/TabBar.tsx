import { TriageTab } from './types';

interface TabBarProps {
  activeTab: TriageTab;
  onTabChange: (tab: TriageTab) => void;
  counts: Record<TriageTab, number>;
}

const TABS: { id: TriageTab; label: string }[] = [
  { id: 'important', label: 'Important' },
  { id: 'needs_reply', label: 'Needs Reply' },
  { id: 'all_others', label: 'All Others' },
  { id: 'starred', label: 'Starred' },
  { id: 'done', label: 'Done' },
];

export default function TabBar({ activeTab, onTabChange, counts }: TabBarProps) {
  return (
    <div className="bg-gray-100 rounded-full p-1 inline-flex gap-1">
      {TABS.map(tab => {
        const isActive = tab.id === activeTab;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={
              isActive
                ? 'bg-white text-gray-900 font-medium rounded-full px-4 py-1.5 shadow-sm flex items-center gap-1.5 text-sm transition-all'
                : 'text-gray-500 hover:text-gray-700 px-4 py-1.5 flex items-center gap-1.5 text-sm rounded-full transition-all'
            }
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${
                  isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
