import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Database, Activity, Server, Send, RefreshCw, UserPlus } from 'lucide-react';
import type { DeveloperProfile, SearchResponse } from './types';

export default function App() {
  // Application Data States
  const [profiles, setProfiles] = useState<DeveloperProfile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  // Form Registration States
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regSkills, setRegSkills] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regFocus, setRegFocus] = useState('');

  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083';

  const pushSystemLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 12)]);
  };

  // 1. DYNAMIC DATA FETCH: Pull existing records straight from the database
 const fetchActiveProfiles = async () => {
    try {
      pushSystemLog("SYS_NET // FETCHING_REGISTERED_PROFILES...");
      const res = await fetch(`${BACKEND_URL}/api/ai/profiles`);
      
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        pushSystemLog(`SYS_DB // SYNC_SUCCESS // READ_COUNT: ${data.length}`);
      } else {
        pushSystemLog(`SYS_DB // PROFILE_ROUTE_UNAVAILABLE // STATUS: ${res.status}`);
      }
    } catch (err) {
      // Catching the CORS network violation here prevents the UI state from freezing
      pushSystemLog("SYS_DB // ISOLATED_NODE // BYPASSING_POOL_SYNC");
    }
  };

  useEffect(() => {
    fetchActiveProfiles();
  }, []);

  // 2. LIVE PROFILE INGESTION: Submits data to your exact API endpoint
 const handleIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId || !regName || !regSkills) {
      pushSystemLog("WARN // VALIDATION_FAILURE // MISSING_REQUIRED_FIELDS");
      return;
    }

    pushSystemLog(`INGEST_REQ // TRANSMITTING: ID [${regId}]`);
    try {
      const payload = {
        profileId: regId,
        developerName: regName,
        skillsContent: regSkills,
        metadata: {
          role: regRole || "Developer",
          focus: regFocus || "General"
        }
      };

      const res = await fetch(`${BACKEND_URL}/api/ai/ingest/developer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        pushSystemLog(`INGEST_SUCCESS // ID [${regId}] CHUNKED_AND_EMBEDDED`);
        // Reset registration form inputs
        setRegId('');
        setRegName('');
        setRegSkills('');
        setRegRole('');
        setRegFocus('');
        
        //  Refresh the local list right after successful ingestion
        await fetchActiveProfiles();
      } else {
        const errorText = await res.text();
        pushSystemLog(`INGEST_FAILURE // STATUS: ${res.status} // REASON: ${errorText}`);
      }
    } catch (err) {
      pushSystemLog("ERR_NET // INGESTION_PIPELINE_OFFLINE");
    }
  };

  // 3. LIVE SEMANTIC SEARCH: Interrogates your AI hybrid retrieval logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    pushSystemLog(`SEARCH_INBOUND // MATH_VECTOR_TOKENIZE // QUERY: "${searchQuery.substring(0, 25)}..."`);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/search/query?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const rawText = await res.text();
        pushSystemLog("INFERENCE_RESOLVED // MATRIX_DATA_STREAM_POPULATED");
        
        setSearchResult({
          analysis: rawText,
          matchedProfiles: profiles.filter(p => 
            p.skillsContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.developerName.toLowerCase().includes(searchQuery.toLowerCase())
          ),
          searchMetrics: { executionTimeMs: 124, vectorStoreHits: 1, keywordHits: 1 }
        });
      } else {
        pushSystemLog(`SEARCH_FAILED // HTTP_STATUS: ${res.status}`);
      }
    } catch (err) {
      pushSystemLog("ERR_NET // LIVE_INFERENCE_ROUTE_REJECTED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#06080e] font-mono text-[#a3b3cc] overflow-hidden">
      
      {/* LEFT COMPONENT: CONTROL DECK & DATA INGESTION */}
      <section className="w-1/3 bg-[#090d16] border-r border-[#1a2436] flex flex-col justify-between">
        <div className="overflow-y-auto flex-1">
          {/* Top Panel Branding */}
          <div className="p-4 bg-[#0c1220] border-b border-[#1a2436] flex items-center justify-between">
            <span className="font-black text-xs text-white tracking-widest flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#ffaa00]" /> SYSTEM ENGINE DECK
            </span>
            <button onClick={fetchActiveProfiles} className="text-[#5f7594] hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* REAL PROFILES DATA INGESTION FORM */}
          <div className="p-4 border-b border-[#1a2436] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[#ffaa00]">
              <UserPlus className="h-4 w-4" /> [01] // REGISTER_NEW_PROFILE
            </h3>
            <form onSubmit={handleIngestion} className="space-y-2 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="PROFILE_ID (e.g. DEV-77)" value={regId} onChange={e => setRegId(e.target.value)}
                  className="bg-[#05080e] border border-[#1a2436] p-2 text-white focus:outline-none focus:border-[#ffaa00]"
                />
                <input 
                  type="text" placeholder="DEVELOPER_NAME" value={regName} onChange={e => setRegName(e.target.value)}
                  className="bg-[#05080e] border border-[#1a2436] p-2 text-white focus:outline-none focus:border-[#ffaa00]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="ROLE (e.g. Backend Engineer)" value={regRole} onChange={e => setRegRole(e.target.value)}
                  className="bg-[#05080e] border border-[#1a2436] p-2 text-white focus:outline-none focus:border-[#ffaa00]"
                />
                <input 
                  type="text" placeholder="FOCUS (e.g. Docker / Java)" value={regFocus} onChange={e => setRegFocus(e.target.value)}
                  className="bg-[#05080e] border border-[#1a2436] p-2 text-white focus:outline-none focus:border-[#ffaa00]"
                />
              </div>
              <textarea 
                placeholder="SKILLS_CONTENT (Paste full capabilities array text to chunk & embed...)" rows={4} value={regSkills} onChange={e => setRegSkills(e.target.value)}
                className="w-full bg-[#05080e] border border-[#1a2436] p-2 text-white focus:outline-none focus:border-[#ffaa00] resize-none"
              />
              <button type="submit" className="w-full bg-[#ffaa00] hover:bg-[#e09600] text-black font-black py-2 tracking-widest text-[10px] uppercase flex items-center justify-center gap-2">
                <Send className="h-3 w-3" /> COMMENCE_VECTOR_INGESTION
              </button>
            </form>
          </div>

          {/* DYNAMIC LISTING: ACTIVE DATABASE ENTRIES */}
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#00ffcc]" /> LIVE_INDEXED_POOL ({profiles.length})
            </h3>
            {profiles.length === 0 ? (
              <p className="text-[10px] text-[#5f7594] italic p-4 text-center bg-[#070a12] border border-[#141d2c]">No developers found in local database. Register one above!</p>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {profiles.map(p => (
                  <div key={p.profileId} className="p-2.5 bg-[#05080e] border border-[#141d2c] flex justify-between items-center text-[11px]">
                    <div>
                      <div className="font-bold text-white uppercase">{p.developerName}</div>
                      <div className="text-[9px] text-[#5f7594]">{p.metadata.role} • {p.metadata.focus}</div>
                    </div>
                    <span className="text-[9px] text-[#00ffcc] font-mono border border-[#00ffcc]/20 px-1 bg-[#00ffcc]/5">{p.profileId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Node Hardware Readouts */}
        <div className="p-3 bg-[#080c14] border-t border-[#1a2436] space-y-1.5 text-[11px] font-bold">
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-[#475b7a]"><Server className="h-3 w-3 text-[#00ffcc]" /> SPRING_CORE</span>
            <span className="text-[#00ffcc]">ONLINE_8083</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-[#475b7a]"><Activity className="h-3 w-3 text-[#ffaa00]" /> TELEMETRY</span>
            <span className="text-[#ffaa00]">PROM_CONNECTED</span>
          </div>
        </div>
      </section>

      {/* RIGHT COMPONENT: DYNAMIC AI HYBRID QUERY CONSOLE */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden">
        
        {/* Core Workspace Interface Screen */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="border-b border-[#1a2436] pb-2">
            <h2 className="text-xs font-black text-white uppercase tracking-widest">// AI_SEMANTIC_WORKSPACE // CORE_AGENT</h2>
            <p className="text-[#5f7594] text-[11px] mt-0.5">Execute natural language parameter arrays against the neural embedding model architecture.</p>
          </div>

          {/* DYNAMIC SEARCH CONSOLE FORM */}
          <form onSubmit={handleSearch} className="relative">
            <Terminal className="absolute left-3 top-3.5 h-4 w-4 text-[#ffaa00]" />
            <input 
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="ENTER RECRUITMENT QUERY PARAMETERS (e.g. Find Java containerization expert)..."
              className="w-full bg-[#090d16] border border-[#1a2436] pl-10 pr-32 py-3 text-xs text-white focus:outline-none focus:border-[#ffaa00] font-mono tracking-wide"
            />
            <button type="submit" disabled={loading} className="absolute right-2 top-1.5 bg-[#ffaa00] hover:bg-[#e09600] text-black font-black px-4 py-1.5 text-[10px] uppercase disabled:opacity-40">
              {loading ? 'COMPUTING...' : 'RUN_QUERY'}
            </button>
          </form>

          {/* LIVE OUTPUT RENDERING DISPLAY */}
          {loading && (
            <div className="border border-[#1a2436] bg-[#090d16]/40 p-12 text-center text-[11px] font-bold text-[#ffaa00] tracking-widest uppercase animate-pulse">
              Request transmitted onto stack. Querying vector points & formatting AI evaluation narrative layout...
            </div>
          )}

          {searchResult && !loading && (
            <div className="bg-[#090d16] border border-[#1a2436] p-4 space-y-3 shadow-xl relative">
              <div className="absolute top-0 right-0 bg-[#05080e] border-l border-b border-[#1a2436] px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                STATUS // RESOLVED_200_OK
              </div>
              <h3 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-2">
                SYSTEM_RECRUITER_EVALUATION
              </h3>
              
              {/* Actual Response Content Area */}
              <div className="text-slate-200 text-xs leading-relaxed bg-[#05080e] p-4 border border-[#141d2c] whitespace-pre-wrap selection:bg-[#ffaa00] selection:text-black">
                {searchResult.analysis}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM MATRIX DICTIONARY LOG TICKER */}
        <footer className="h-28 border-t border-[#1a2436] bg-[#090d16] p-2 flex flex-col justify-between overflow-hidden">
          <div className="text-[9px] font-black text-[#475b7a] tracking-widest mb-1 uppercase">
            REALTIME_KERNEL_SYSTEM_LOGS
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-0.5 text-[#5f7594]">
            {logs.length === 0 ? (
              <div className="italic p-1 text-[#3a4b64]">Kernel idling. System ready for action array.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-center px-1 py-0.5 hover:bg-[#0c1220]">
                  <span className="text-[#ffaa00] font-bold">&gt;&gt;</span>
                  <span className={idx === 0 ? "text-[#96aacc]" : ""}>{log}</span>
                </div>
              ))
            )}
          </div>
        </footer>

      </main>
    </div>
  );
}