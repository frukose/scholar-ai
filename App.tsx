
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { performResearch } from './services/geminiService';
import { ResearchMode, ResearchResponse, SessionState } from './types';
import ResearchCard from './components/ResearchCard';

const QUICK_PROMPTS = [
  { label: 'Summarize Field', icon: 'fa-book-open-reader', text: 'Provide a comprehensive summary of the current state of research regarding: ' },
  { label: 'Identify Gaps', icon: 'fa-bridge-circle-exclamation', text: 'Analyze current literature to identify major research gaps and unexplored avenues in: ' },
  { label: 'Method Audit', icon: 'fa-vial-circle-check', text: 'Evaluate the typical methodologies, strengths, and weaknesses of studies concerning: ' },
  { label: 'Future Directions', icon: 'fa-compass', text: 'What are the predicted future directions and emerging trends for: ' },
  { label: 'Conflict Analysis', icon: 'fa-scale-unbalanced', text: 'Detail the primary points of contention and conflicting findings in the field of: ' }
];

const MODE_DETAILS = {
  [ResearchMode.SYNTHESIS]: { label: 'Synthesis', description: 'Combines findings from multiple sources.', icon: 'fa-vials' },
  [ResearchMode.LIT_REVIEW]: { label: 'Lit Review', description: 'Structured outline of thematic clusters.', icon: 'fa-book-open' },
  [ResearchMode.CRITICAL_ANALYSIS]: { label: 'Critical Analysis', description: 'Evaluates methodologies and bias.', icon: 'fa-magnifying-glass-chart' },
  [ResearchMode.HYPOTHESIS_GEN]: { label: 'Hypothesis Gen', description: 'Predicts novel research directions.', icon: 'fa-lightbulb' }
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<ResearchMode>(ResearchMode.SYNTHESIS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [state, setState] = useState<SessionState>({
    history: [],
    isLoading: false,
    error: null,
  });
  
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => isRecording ? recognitionRef.current?.stop() : recognitionRef.current?.start();

  const handleResearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await performResearch(query, mode);
      setState(prev => ({
        ...prev,
        history: [{ ...result, query, fullDate: new Date().toLocaleDateString() } as any, ...prev.history],
        isLoading: false
      }));
      setQuery('');
      setTimeout(() => resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [query, mode]);

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col z-50 overflow-hidden`}>
        <div className="p-4 border-b min-w-[320px]">
          <h2 className="font-bold text-slate-800 text-sm mb-4"><i className="fa-solid fa-clock-rotate-left mr-2 text-blue-500"></i> Archive</h2>
          <input type="text" placeholder="Search history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto min-w-[320px] p-2">
          {state.history.length === 0 ? <p className="text-center text-slate-400 py-10 text-xs">No research history</p> : 
            state.history.filter(h => h.query?.toLowerCase().includes(searchQuery.toLowerCase())).map((item: any, i) => (
              <div key={i} className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-blue-100 mb-1" onClick={() => setQuery(item.query)}>
                <p className="text-[10px] text-blue-600 font-bold mb-1">{item.timestamp}</p>
                <p className="text-xs text-slate-700 font-medium truncate">{item.query}</p>
              </div>
            ))
          }
        </div>
        <div className="p-4 border-t min-w-[320px] flex justify-between items-center">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini 3 Flash Enabled</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <nav className="glass-effect px-6 py-3 flex items-center justify-between border-b border-slate-200 z-30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <i className={`fa-solid ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'} text-lg`}></i>
            </button>
            <span className="text-lg font-bold tracking-tight text-slate-800">ScholarPulse<span className="text-blue-600">AI</span></span>
          </div>
          <div className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {Object.entries(MODE_DETAILS).map(([m, detail]) => (
              <button key={m} onClick={() => setMode(m as ResearchMode)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                <i className={`fa-solid ${detail.icon} mr-1.5`}></i>{detail.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto w-full">
            {state.history.length === 0 && !state.isLoading && (
              <div className="text-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">High-Quality <span className="gradient-text">Research Intelligence</span></h1>
                <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed mb-12">PhD-level synthesis using Google's most advanced Flash models.</p>
              </div>
            )}
            <div className="space-y-8">
              {state.isLoading && (
                <div className="bg-white rounded-[2.5rem] p-16 shadow-xl border border-slate-200 text-center animate-pulse">
                   <i className="fa-solid fa-atom fa-spin text-blue-600 text-4xl mb-4"></i>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Analyzing Knowledge Index</h3>
                </div>
              )}
              {state.error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">{state.error}</div>}
              {state.history.map((item, idx) => <ResearchCard key={idx} data={item} />)}
              <div ref={resultsEndRef} />
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
              {QUICK_PROMPTS.map((p) => (
                <button key={p.label} onClick={() => setQuery(p.text)} className="px-4 py-2 rounded-full bg-slate-100 border text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-semibold whitespace-nowrap">
                  <i className={`fa-solid ${p.icon} mr-2`}></i>{p.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleResearch} className="relative group">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isRecording ? "Listening..." : "Describe your research objective..."} className="w-full bg-slate-100 border-2 border-transparent rounded-[2rem] pl-8 pr-40 py-6 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xl font-medium shadow-sm" />
              <div className="absolute inset-y-2 right-2 flex space-x-2">
                <button type="button" onClick={toggleRecording} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 border'}`}><i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i></button>
                <button type="submit" disabled={state.isLoading || !query.trim()} className="bg-blue-600 text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg disabled:bg-slate-300">{state.isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Analyze"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
