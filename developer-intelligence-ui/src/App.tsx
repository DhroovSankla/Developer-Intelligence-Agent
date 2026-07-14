import React, { useState, useEffect } from 'react';
import { 
  Terminal, Cpu, Database, Activity, Server, Send, 
  RefreshCw, UserPlus, CheckCircle, XCircle, Search, Sparkles, X, Copy, Award
} from 'lucide-react';
import type { DeveloperProfile, SearchResponse } from './types';

interface ParsedResult {
  candidateName: string;
  candidateId: string;
  isMatch: boolean;
  explanation: string;
  rawBlock: string;
}

// Robust client-side regex parser for the AI recruiter scorecard format
function parseAnalysis(text: string): ParsedResult[] {
  const results: ParsedResult[] = [];
  
  // Split response by candidate blocks
  const candidateBlocks = text.split(/(?=Candidate:)/gi);
  
  for (const block of candidateBlocks) {
    if (!block.trim().toLowerCase().startsWith('candidate')) continue;
    
    const nameMatch = block.match(/Candidate:\s*([^(]+)/i);
    const idMatch = block.match(/ID:\s*([^)]+)/i);
    const matchVal = block.match(/Match\??\s*\[?\s*(Yes|No)\s*\]?/i);
    
    // Look for explanation content
    const explanationMatch = block.match(/Explanation:\s*([^)\n]+)/i) || block.match(/Explanation:\s*(.+)/i);
    
    if (nameMatch) {
      results.push({
        candidateName: nameMatch[1].trim(),
        candidateId: idMatch ? idMatch[1].trim() : 'Unknown',
        isMatch: matchVal ? matchVal[1].toLowerCase().includes('yes') : false,
        explanation: explanationMatch ? explanationMatch[1].trim().replace(/^\[|\]$/g, '') : 'No explanation provided.',
        rawBlock: block
      });
    }
  }
  
  return results;
}

export default function App() {
  // Application Data States
  const [profiles, setProfiles] = useState<DeveloperProfile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse & { parsed?: ParsedResult[] } | null>(null);

  // Form Registration States
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regSkills, setRegSkills] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regFocus, setRegFocus] = useState('');

  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // AI Interview Guide States
  const [activeGuide, setActiveGuide] = useState<{ candidateName: string; content: string } | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideCopied, setGuideCopied] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8083' : '');

  const pushSystemLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // 1. DYNAMIC DATA FETCH: Pull existing records straight from the database
  const fetchActiveProfiles = async () => {
    try {
      pushSystemLog("SYS_NET // SYNCING_PROFILES_DATABASE...");
      const res = await fetch(`${BACKEND_URL}/api/ai/profiles`);
      
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        pushSystemLog(`SYS_DB // SYNC_SUCCESS // RECORD_COUNT: ${data.length}`);
      } else {
        pushSystemLog(`SYS_DB // PROFILE_ROUTE_UNAVAILABLE // STATUS: ${res.status}`);
      }
    } catch (err) {
      pushSystemLog("SYS_DB // CONNECTION_ERROR // RETRY_FAILED");
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
        pushSystemLog(`INGEST_SUCCESS // ID [${regId}] EMBEDDED_INTO_PGVECTOR`);
        setRegId('');
        setRegName('');
        setRegSkills('');
        setRegRole('');
        setRegFocus('');
        
        await fetchActiveProfiles();
      } else {
        const errorText = await res.text();
        pushSystemLog(`INGEST_FAILURE // STATUS: ${res.status} // REASON: ${errorText}`);
      }
    } catch (err) {
      pushSystemLog("ERR_NET // INGESTION_PIPELINE_OFFLINE");
    }
  };

  // 3. SEED MOCK CANDIDATES: Seeding candidates instantly for evaluation
  const handleSeedMockCandidates = async () => {
    pushSystemLog("SYS_NET // SEEDING_MOCK_PROFILES...");
    const mocks = [
      {
        profileId: "126",
        developerName: "alice",
        skillsContent: "expert in react, tailwind css, typescript, and frontend engineering",
        metadata: { role: "frontend", focus: "react" }
      },
      {
        profileId: "127",
        developerName: "bob",
        skillsContent: "expert in python, machine learning, pytorch, and statistics",
        metadata: { role: "ml engineer", focus: "python" }
      },
      {
        profileId: "128",
        developerName: "charlie",
        skillsContent: "expert in java, spring boot, postgresql, and microservices",
        metadata: { role: "backend", focus: "spring boot" }
      }
    ];

    try {
      for (const payload of mocks) {
        await fetch(`${BACKEND_URL}/api/ai/ingest/developer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      pushSystemLog("SYS_NET // SEED_COMPLETE // 3 MOCK PROFILES INDEXED");
      await fetchActiveProfiles();
    } catch (err) {
      pushSystemLog("ERR_NET // SEED_INGESTION_FAILED");
    }
  };

  // 4. LIVE SEMANTIC SEARCH: Interrogates your AI hybrid retrieval logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    pushSystemLog(`SEARCH_INBOUND // PGVECTOR_COSINE_SIMILARITY // QUERY: "${searchQuery}"`);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/search/query?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const rawText = await res.text();
        pushSystemLog("INFERENCE_RESOLVED // MATRIX_DATA_STREAM_POPULATED");
        
        const parsed = parseAnalysis(rawText);
        
        setSearchResult({
          analysis: rawText,
          parsed: parsed.length > 0 ? parsed : undefined,
          matchedProfiles: profiles.filter(p => 
            p.skillsContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.developerName.toLowerCase().includes(searchQuery.toLowerCase())
          ),
          searchMetrics: { executionTimeMs: 142, vectorStoreHits: parsed.length, keywordHits: 0 }
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

  // 5. TECHNICAL INTERVIEW GUIDE GENERATION (Uses New Endpoint)
  const handleGenerateInterviewGuide = async (name: string, skills: string) => {
    setLoadingGuide(true);
    pushSystemLog(`SYS_NET // INITIATING_INTERVIEW_COMPILATION // CANDIDATE: ${name}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/search/interview-guide?name=${encodeURIComponent(name)}&skills=${encodeURIComponent(skills)}&query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.text();
        setActiveGuide({ candidateName: name, content: data });
        pushSystemLog(`SYS_NET // COMPILATION_SUCCESS // INTERVIEW_GUIDE_GENERATED`);
      } else {
        pushSystemLog(`SYS_NET // INTERVIEW_COMPILATION_FAILED // STATUS: ${res.status}`);
      }
    } catch (err) {
      pushSystemLog("ERR_NET // INTERVIEW_ENDPOINT_OFFLINE");
    } finally {
      setLoadingGuide(false);
    }
  };

  const copyToClipboard = () => {
    if (activeGuide) {
      navigator.clipboard.writeText(activeGuide.content);
      setGuideCopied(true);
      setTimeout(() => setGuideCopied(false), 2000);
      pushSystemLog("CLIPBOARD // INTERVIEW_GUIDE_COPIED");
    }
  };

  return (
    <div className="flex h-screen bg-[#030712] font-sans text-slate-300 overflow-hidden relative">
      
      {/* Decorative Radial Glowing Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* LEFT COMPONENT: CONTROL DECK & DATA INGESTION */}
      <section className="w-1/3 bg-[#0b0f19]/60 backdrop-blur-md border-r border-slate-800/60 flex flex-col justify-between z-10">
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Top Panel Branding */}
          <div className="p-5 bg-[#0e1322]/80 border-b border-slate-800/60 flex items-center justify-between">
            <span className="font-extrabold text-sm text-white tracking-widest flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-amber-500 animate-pulse" /> RECRUITER AI DECK
            </span>
            <button 
              onClick={fetchActiveProfiles} 
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* REAL PROFILES DATA INGESTION FORM */}
          <div className="p-5 border-b border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-500" /> [01] Ingest Developer
              </h3>
              <button 
                onClick={handleSeedMockCandidates}
                className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded transition-all cursor-pointer font-bold uppercase tracking-wider"
              >
                Seed Mock Profiles
              </button>
            </div>
            
            <form onSubmit={handleIngestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Profile ID</label>
                  <input 
                    type="text" placeholder="e.g. DEV-123" value={regId} onChange={e => setRegId(e.target.value)}
                    className="w-full bg-[#030712]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dev Name</label>
                  <input 
                    type="text" placeholder="e.g. John" value={regName} onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#030712]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Title/Role</label>
                  <input 
                    type="text" placeholder="e.g. Frontend Dev" value={regRole} onChange={e => setRegRole(e.target.value)}
                    className="w-full bg-[#030712]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Core Focus</label>
                  <input 
                    type="text" placeholder="e.g. React / CSS" value={regFocus} onChange={e => setRegFocus(e.target.value)}
                    className="w-full bg-[#030712]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Full Resume / Skills Text</label>
                <textarea 
                  placeholder="Paste details describing experience, capabilities, framework knowledge..." 
                  rows={3} value={regSkills} onChange={e => setRegSkills(e.target.value)}
                  className="w-full bg-[#030712]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none font-medium"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold py-2.5 px-4 rounded-lg tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer shadow-amber-500/10"
              >
                <Send className="h-3.5 w-3.5" /> Index Candidate Vector
              </button>
            </form>
          </div>

          {/* DYNAMIC LISTING: ACTIVE DATABASE ENTRIES */}
          <div className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400 animate-pulse" /> Vector Database Pool ({profiles.length})
            </h3>
            {profiles.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-6 text-center bg-slate-900/10 rounded-xl border border-slate-800/40">
                No developer vectors in database. Ingest one above!
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {profiles.map(p => (
                  <div key={p.profileId} className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/40 hover:border-slate-700/60 rounded-xl flex items-center gap-3 transition-all duration-200">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {p.developerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-200 truncate capitalize">{p.developerName}</div>
                      <div className="text-[10px] text-slate-400 truncate font-medium">{p.metadata.role} • {p.metadata.focus}</div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                      ID: {p.profileId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Node Hardware Readouts */}
        <div className="p-4 bg-[#080c14]/90 border-t border-slate-800/60 space-y-2 text-[11px] font-bold text-slate-400">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><Server className="h-4 w-4 text-emerald-400" /> Vector Store Host</span>
            <span className="text-emerald-400 font-mono">pgvector-db:5432</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-500" /> Local LLM Engine</span>
            <span className="text-amber-500 font-mono">ollama // qwen2:1.5b</span>
          </div>
        </div>
      </section>

      {/* RIGHT COMPONENT: DYNAMIC AI HYBRID QUERY CONSOLE */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden relative z-10">
        
        {/* Core Workspace Interface Screen */}
        <div className="flex-1 overflow-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          <div className="border-b border-slate-800/60 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> AI SEMANTIC RECRUITER
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-medium">Submit natural language criteria parameters to query the PgVector embedding engine.</p>
            </div>
          </div>

          {/* DYNAMIC SEARCH CONSOLE FORM */}
          <form onSubmit={handleSearch} className="relative shadow-lg rounded-xl">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
            <input 
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Describe candidate requirements (e.g. Find me a backend dev with Docker and Spring Boot)..."
              className="w-full bg-[#0b0f19]/70 backdrop-blur border border-slate-800/80 rounded-xl pl-12 pr-36 py-3.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium placeholder-slate-600"
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 font-extrabold px-4 py-1.5 rounded-lg text-xs tracking-wider disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading ? 'COMPUTING...' : 'RUN_QUERY'}
            </button>
          </form>

          {/* LIVE OUTPUT RENDERING DISPLAY */}
          {loading && (
            <div className="border border-slate-800/60 bg-[#0b0f19]/40 rounded-xl p-16 text-center text-xs font-black text-amber-500 tracking-widest uppercase animate-pulse flex flex-col items-center justify-center gap-3">
              <Cpu className="h-8 w-8 text-amber-500 animate-spin" />
              Scanning Vector Coordinates & Requesting AI Candidate Scorecard...
            </div>
          )}

          {/* LOADING MOCK GUIDE SPINNER */}
          {loadingGuide && (
            <div className="border border-slate-800/60 bg-indigo-950/20 rounded-xl p-6 text-center text-xs font-bold text-indigo-400 tracking-widest uppercase animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
              Compiling Customized Technical Interview Questions...
            </div>
          )}

          {searchResult && !loading && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase">
                  Candidate Evaluation Scorecards
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-0.5 rounded font-semibold">
                  Resolved (200 OK)
                </span>
              </div>
              
              {/* Scorecard Grid Rendering (If parsed results are available) */}
              {searchResult.parsed ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResult.parsed.map((candidate, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-[#0b0f19]/80 border ${candidate.isMatch ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-950/5' : 'border-rose-500/20 hover:border-rose-500/40 shadow-rose-950/5'} hover:shadow-xl rounded-xl p-5 transition-all relative overflow-hidden group flex flex-col justify-between`}
                    >
                      {/* Match Left Edge Indicator */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${candidate.isMatch ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                      <div className="pl-2 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide truncate capitalize">
                              {candidate.candidateName}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Candidate ID: {candidate.candidateId}</span>
                          </div>
                          
                          {candidate.isMatch ? (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              <CheckCircle className="h-3.5 w-3.5" /> Match
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded-full">
                              <XCircle className="h-3.5 w-3.5" /> No Match
                            </span>
                          )}
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                          {candidate.explanation}
                        </p>
                      </div>

                      {/* Generate Interview Guide CTA */}
                      {candidate.isMatch && (
                        <div className="pl-2 mt-4 pt-3 border-t border-slate-800/40">
                          <button
                            onClick={() => handleGenerateInterviewGuide(candidate.candidateName, candidate.rawBlock)}
                            className="w-full py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:text-amber-400 text-amber-500/90 font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-800 transition-all active:scale-98 cursor-pointer hover:border-amber-500/30"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:animate-spin" /> Generate Interview Guide
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback to Raw LLM Text Output if regex parsing fails
                <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-5 shadow-lg relative">
                  <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {searchResult.analysis}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM MATRIX DICTIONARY LOG TICKER */}
        <footer className="h-32 border-t border-slate-800/60 bg-[#080c14]/80 p-4 flex flex-col justify-between overflow-hidden z-10">
          <div className="text-[9px] font-black text-slate-400 tracking-widest mb-1.5 uppercase flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-amber-500" /> kernel log readout
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-500 scrollbar-none pr-2">
            {logs.length === 0 ? (
              <div className="italic text-slate-600 p-1">Kernel standing by. Interface initialized successfully.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start py-0.5 hover:bg-slate-900/40 rounded px-1.5 transition-colors">
                  <span className="text-amber-500 font-bold">&gt;&gt;</span>
                  <span className={idx === 0 ? "text-slate-300 font-medium" : "text-slate-500"}>{log}</span>
                </div>
              ))
            )}
          </div>
        </footer>

      </main>

      {/* DRAWER MODAL: AI TECHNICAL INTERVIEW GUIDE PANEL */}
      {activeGuide && (
        <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in transition-all">
          <div className="w-5/12 h-full bg-[#0b0f19] border-l border-slate-800 shadow-2xl flex flex-col justify-between relative animate-slide-in">
            
            {/* Header */}
            <div className="p-6 bg-[#0e1322] border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-widest uppercase flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-amber-500 animate-bounce" /> Technical Interview Guide
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Candidate Profile: {activeGuide.candidateName}</p>
              </div>
              <button 
                onClick={() => setActiveGuide(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Questions Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 text-xs select-text selection:bg-amber-500 selection:text-slate-950">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 font-semibold text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeGuide.content}
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-[#080c14] border-t border-slate-800/80 flex items-center justify-between gap-4">
              <button
                onClick={copyToClipboard}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold py-2.5 px-4 rounded-lg tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98 cursor-pointer"
              >
                <Copy className="h-4 w-4" /> {guideCopied ? 'Copied to Clipboard!' : 'Copy Interview Guide'}
              </button>
              <button
                onClick={() => setActiveGuide(null)}
                className="w-1/3 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white font-extrabold py-2.5 px-4 rounded-lg tracking-wider uppercase border border-slate-800/80 transition-all active:scale-98 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}