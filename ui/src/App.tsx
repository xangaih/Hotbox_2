import { useState, useEffect, useCallback } from 'react';
import { Lead, OutputJson, TriageTab, SortMode } from './types';
import TabBar from './TabBar';
import LeadList from './LeadList';
import LeadDetail from './LeadDetail';

const API = 'http://localhost:8000';

type PipelineStatus = 'idle' | 'running' | 'done' | 'error';

interface ServerStatus {
  running: boolean;
  progress: string;
  done: number;
  total: number;
}

function hydrateLeads(data: OutputJson): Lead[] {
  return Object.entries(data).map(([username, lead]) => ({ ...lead, username }));
}

export default function App() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TriageTab>('important');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');
  const [pipelineProgress, setPipelineProgress] = useState('');
  const [pipelineDone, setPipelineDone] = useState(0);
  const [pipelineTotal, setPipelineTotal] = useState(0);

  // Prospect state — mirrors pipeline state pattern exactly
  const [prospectStatus, setProspectStatus]     = useState<'idle'|'running'|'done'|'error'>('idle');
  const [prospectProgress, setProspectProgress] = useState('');
  const [prospectUsername, setProspectUsername] = useState('');
  const [showProspectInput, setShowProspectInput] = useState(false);

  const [triageOverrides, setTriageOverrides] = useState<Record<string, TriageTab>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('triage-overrides') || '{}');
      } catch {
        return {};
      }
    }
  );

  useEffect(() => {
    localStorage.setItem('triage-overrides', JSON.stringify(triageOverrides));
  }, [triageOverrides]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API}/leads`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: OutputJson = await res.json();
      setAllLeads(hydrateLeads(data));
      setLoadError(null);
    } catch (e) {
      setLoadError('Cannot reach the pipeline server. Start it with: cd pipeline && uvicorn server:app --reload');
    }
  }, []);

  // Load leads on mount
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Poll server status while pipeline is running
  useEffect(() => {
    if (pipelineStatus !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/status`);
        const s: ServerStatus = await res.json();
        setPipelineProgress(s.progress);
        setPipelineDone(s.done);
        setPipelineTotal(s.total);
        if (!s.running) {
          setPipelineStatus(s.progress.startsWith('Error') ? 'error' : 'done');
          clearInterval(interval);
          fetchLeads();
        }
      } catch {
        setPipelineStatus('error');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pipelineStatus, fetchLeads]);

  useEffect(() => {
    if (prospectStatus !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/prospect/status`);
        const s = await res.json();
        setProspectProgress(s.progress);
        if (!s.running) {
          setProspectStatus(s.progress.startsWith('Error') ? 'error' : 'done');
          clearInterval(interval);
          fetchLeads();
        }
      } catch {
        setProspectStatus('error');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [prospectStatus, fetchLeads]);

  async function runPipeline() {
    setPipelineStatus('running');
    setPipelineProgress('Starting...');
    setPipelineDone(0);
    setPipelineTotal(0);
    try {
      const res = await fetch(`${API}/run`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        setPipelineProgress(err.detail ?? 'Error starting pipeline');
        setPipelineStatus('error');
      }
    } catch {
      setPipelineProgress('Cannot reach server');
      setPipelineStatus('error');
    }
  }

  async function runProspect() {
    if (!prospectUsername.trim()) return;
    setProspectStatus('running');
    setProspectProgress('Starting...');
    setShowProspectInput(false);
    try {
      const res = await fetch(`${API}/prospect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: prospectUsername.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setProspectProgress(err.detail ?? 'Error starting prospector');
        setProspectStatus('error');
      }
    } catch {
      setProspectProgress('Cannot reach server');
      setProspectStatus('error');
    }
  }

  const leads = allLeads.map(lead => ({
    ...lead,
    triage: triageOverrides[lead.username] ?? lead.triage,
  }));

  const selectedLead = leads.find(l => l.username === selectedUsername) ?? null;

  function setTriage(username: string, triage: TriageTab) {
    setTriageOverrides(prev => ({ ...prev, [username]: triage }));
  }

  const tabCounts: Record<TriageTab, number> = {
    important:   leads.filter(l => l.triage === 'important').length,
    needs_reply: leads.filter(l => l.triage === 'needs_reply').length,
    all_others:  leads.filter(l => l.triage === 'all_others').length,
    starred:     leads.filter(l => l.triage === 'starred').length,
    done:        leads.filter(l => l.triage === 'done').length,
    cold_leads:  leads.filter(l => l.triage === 'cold_leads').length,
  };

  const progressPct = pipelineTotal > 0 ? Math.round((pipelineDone / pipelineTotal) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">AF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Apex Fuel</h1>
            <p className="text-xs text-gray-500">Lead Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pipeline progress */}
          {pipelineStatus === 'running' && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {pipelineDone}/{pipelineTotal > 0 ? pipelineTotal : '?'} leads
              </span>
            </div>
          )}
          {pipelineStatus === 'done' && (
            <span className="text-xs text-green-600 font-medium">Pipeline complete</span>
          )}
          {pipelineStatus === 'error' && (
            <span className="text-xs text-red-500">{pipelineProgress}</span>
          )}

          {/* Prospect input — appears when button is clicked */}
          {showProspectInput && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="instagram username"
                value={prospectUsername}
                onChange={e => setProspectUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runProspect()}
                autoFocus
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-full outline-none focus:border-gray-500 w-44"
              />
              <button
                onClick={runProspect}
                disabled={!prospectUsername.trim()}
                className="text-xs px-3 py-1.5 rounded-full font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Go
              </button>
              <button
                onClick={() => setShowProspectInput(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Prospect status display */}
          {prospectStatus === 'running' && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              {prospectProgress || 'Prospecting...'}
            </span>
          )}
          {prospectStatus === 'done' && (
            <span className="text-xs text-green-600 font-medium">Prospect complete</span>
          )}
          {prospectStatus === 'error' && (
            <span className="text-xs text-red-500">{prospectProgress}</span>
          )}

          {/* Prospect button */}
          <button
            onClick={() => {
              setShowProspectInput(v => !v);
              setProspectStatus('idle');
              setProspectUsername('');
            }}
            disabled={prospectStatus === 'running'}
            className={`text-xs px-4 py-1.5 rounded-full font-medium border transition-colors ${
              prospectStatus === 'running'
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            {prospectStatus === 'running' ? 'Prospecting...' : '🔍 Prospect'}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchLeads}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-full hover:border-gray-300 transition-colors"
            title="Reload leads from server"
          >
            Refresh
          </button>

          {/* Run pipeline button */}
          <button
            onClick={runPipeline}
            disabled={pipelineStatus === 'running'}
            className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
              pipelineStatus === 'running'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            {pipelineStatus === 'running' ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
      </header>

      {/* Server error banner */}
      {loadError && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800">
          {loadError}
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <TabBar
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setSelectedUsername(null); }}
          counts={tabCounts}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <LeadList
          leads={leads}
          activeTab={activeTab}
          sortMode={sortMode}
          selectedUsername={selectedUsername}
          onSelectLead={setSelectedUsername}
          onSortChange={setSortMode}
        />

        <main className="flex-1 overflow-y-auto">
          {selectedLead ? (
            <LeadDetail
              lead={selectedLead}
              onTriageChange={(triage) => setTriage(selectedLead.username, triage)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-sm font-medium text-gray-500">Select a lead to review</p>
                {leads.length === 0 && !loadError && (
                  <p className="text-xs text-gray-400 mt-1">
                    No leads yet — run the pipeline to process leads.json
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
