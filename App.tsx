
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { performResearch } from './services/geminiService';
import { ResearchMode, SessionState } from './types';
import ResearchCard from './components/ResearchCard';

const QUICK_PROMPTS = [
  { label: 'Summarize Field', icon: 'fa-book-open-reader', text: 'Synthesize the current state of research regarding: ' },
  { label: 'Identify Gaps', icon: 'fa-bridge-circle-exclamation', text: 'Analyze literature to identify major research gaps in: ' },
  { label: 'Method Audit', icon: 'fa-vial-circle-check', text: 'Evaluate common methodologies and pitfalls in studies of: ' },
  { label: 'Future Directions', icon: 'fa-compass', text: 'What are the predicted emerging trends for: ' },
];

const MODE_DETAILS = {
  [ResearchMode.SYNTHESIS]: { label: 'Synthesis', icon: 'fa-vials' },
  [ResearchMode.LIT_REVIEW]: { label: 'Lit Review', icon: 'fa-book-open' },
  [ResearchMode.CRITICAL_ANALYSIS]: { label: 'Analysis', icon: 'fa-magnifying-glass-chart' },
  [ResearchMode.HYPOTHESIS_GEN]: { label: 'Hypothesis', icon: 'fa-lightbulb' }
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<ResearchMode>(ResearchMode.SYNTHESIS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [state, setState] = useState<SessionState>({
    history: [],
    isLoading: false,
    error: null,
  });
  
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
    const currentQuery = query.trim();
    if (!currentQuery) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await performResearch(currentQuery, mode);
      setState(prev => ({
        ...prev,
        history: [{ ...result, query: currentQuery } as any, ...prev.history],
        isLoading: false
      }));
      setQuery('');
      setTimeout(() => resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [query, mode]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden shadow-xl`}>
        <div className="p-6 border-b dark:border-slate-800 min-w-[320px]">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center uppercase tracking-widest">
            <i className="fa-solid fa-clock-rotate-left mr-3 text-blue-500"></i> Archive
          </h2>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-slate-300" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-w-[320px] p-4 space-y-2">
          {state.history.length === 0 ? (
            <div className="text-center py-20 opacity-20 dark:opacity-40">
              <i className="fa-solid fa-box-archive text-3xl mb-3 block"></i>
              <p className="text-xs font-medium uppercase tracking-widest">Repository empty</p>
            </div>
          ) : (
            state.history
              .filter(h => h.query?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item: any, i) => (
                <button 
                  key={i} 
                  className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                  onClick={() => setQuery(item.query)}
                >
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black mb-1 uppercase tracking-tighter">{item.timestamp}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.query}</p>
                </button>
              ))
          )}
        </div>

        <div className="p-6 border-t dark:border-slate-800 min-w-[320px] bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ScholarPulse</span>
            <div className="flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Neural v3
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <nav className="glass-effect px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 z-30">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors border border-transparent active:scale-95">
              <i className={`fa-solid ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'} text-lg`}></i>
            </button>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">ScholarPulse<span className="text-blue-600">AI</span></span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex space-x-1 bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              {Object.entries(MODE_DETAILS).map(([m, detail]) => (
                <button 
                  key={m} 
                  onClick={() => setMode(m as ResearchMode)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center ${mode === m ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <i className={`fa-solid ${detail.icon} mr-2`}></i>{detail.label}
                </button>
              ))}
            </div>
            
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent active:scale-95 shadow-sm"
              title="Toggle Appearance"
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
            </button>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto px-8 py-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-4xl mx-auto w-full">
            {state.history.length === 0 && !state.isLoading && (
              <div className="text-center py-20 lg:py-32">
                <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <i className="fa-solid fa-microscope text-4xl text-white"></i>
                </div>
                <h1 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                  Deep <span className="gradient-text">Research Synthesis</span>
                </h1>
                <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mb-12 font-medium">
                  State-of-the-art autonomous research engine for academic literature extraction and multi-source verification.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                   <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left shadow-sm">
                     <i className="fa-solid fa-bolt text-blue-500 mb-3 block"></i>
                     <h3 className="text-xs font-black uppercase mb-1 dark:text-slate-200">High-Fidelity</h3>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">Optimized extraction algorithms</p>
                   </div>
                   <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left shadow-sm">
                     <i className="fa-solid fa-earth-americas text-green-500 mb-3 block"></i>
                     <h3 className="text-xs font-black uppercase mb-1 dark:text-slate-200">Live Grounding</h3>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">Real-time source validation</p>
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-10">
              {state.isLoading && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-24 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                     <div className="h-full bg-blue-600 w-1/3 animate-[loading_1.5s_infinite_linear]"></div>
                   </div>
                   <div className="space-y-6">
                     <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2 shadow-inner">
                       <i className="fa-solid fa-atom fa-spin text-3xl"></i>
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Synthesizing Findings</h3>
                     <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto font-medium">Accessing global knowledge graph and performing semantic cross-verification...</p>
                   </div>
                </div>
              )}
              
              {state.error && (
                <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 flex items-start space-x-6 animate-in fade-in zoom-in shadow-xl shadow-rose-900/5">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <i className="fa-solid fa-triangle-exclamation text-rose-600 dark:text-rose-400 text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm uppercase mb-2 tracking-widest flex items-center">
                      Critical System Insight
                    </h4>
                    <p className="text-sm leading-relaxed font-medium opacity-90">{state.error}</p>
                    <div className="mt-4 flex space-x-4">
                      <button 
                        onClick={() => setState(prev => ({ ...prev, error: null }))}
                        className="text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/10"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {state.history.map((item, idx) => <ResearchCard key={idx} data={item} />)}
              <div ref={resultsEndRef} />
            </div>
          </div>
        </main>

        {/* Input Footer */}
        <footer className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2 overflow-x-auto pb-4 mb-3 no-scrollbar scroll-smooth">
              {QUICK_PROMPTS.map((p) => (
                <button 
                  key={p.label} 
                  onClick={() => setQuery(p.text)} 
                  className="px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-[11px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 shadow-sm"
                >
                  <i className={`fa-solid ${p.icon} mr-2 text-blue-500`}></i>{p.label}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleResearch} className="relative group">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder={isRecording ? "Neural audio input active..." : "Specify research parameters..."} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem] pl-10 pr-44 py-7 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-all text-xl font-medium shadow-sm dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
              />
              <div className="absolute inset-y-3 right-3 flex space-x-3">
                <button 
                  type="button" 
                  onClick={toggleRecording} 
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border shadow-sm ${isRecording ? 'bg-rose-500 text-white animate-pulse border-rose-600' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:text-blue-500 hover:border-blue-400'}`}
                >
                  <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
                </button>
                <button 
                  type="submit" 
                  disabled={state.isLoading || !query.trim()} 
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-10 h-14 rounded-3xl font-black uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:shadow-none transition-all active:scale-95 disabled:text-slate-400"
                >
                  {state.isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Synthesize"}
                </button>
              </div>
            </form>
            <p className="mt-5 text-center text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">
              Grounded Neural Intelligence &bull; Real-Time Verification
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
