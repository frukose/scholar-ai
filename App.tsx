
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
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col z-50 overflow-hidden shadow-xl`}>
        <div className="p-6 border-b min-w-[320px]">
          <h2 className="font-bold text-slate-800 text-sm mb-4 flex items-center">
            <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-500"></i> Session Archive
          </h2>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search archive..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-w-[320px] p-4 space-y-2">
          {state.history.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <i className="fa-solid fa-box-archive text-3xl mb-3 block"></i>
              <p className="text-xs font-medium">No archived findings</p>
            </div>
          ) : (
            state.history
              .filter(h => h.query?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item: any, i) => (
                <button 
                  key={i} 
                  className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                  onClick={() => setQuery(item.query)}
                >
                  <p className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-tighter">{item.timestamp}</p>
                  <p className="text-xs text-slate-700 font-semibold line-clamp-2 group-hover:text-blue-700">{item.query}</p>
                </button>
              ))
          )}
        </div>

        <div className="p-6 border-t min-w-[320px] bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">ScholarPulse Elite</span>
            <div className="flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Neural Core v3
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <nav className="glass-effect px-8 py-4 flex items-center justify-between border-b border-slate-200 z-30">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-transparent active:scale-95">
              <i className={`fa-solid ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'} text-lg`}></i>
            </button>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-slate-900">ScholarPulse<span className="text-blue-600">AI</span></span>
              <span className="ml-3 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase">Pro</span>
            </div>
          </div>
          
          <div className="hidden lg:flex space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
            {Object.entries(MODE_DETAILS).map(([m, detail]) => (
              <button 
                key={m} 
                onClick={() => setMode(m as ResearchMode)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center ${mode === m ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className={`fa-solid ${detail.icon} mr-2`}></i>{detail.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-4xl mx-auto w-full">
            {state.history.length === 0 && !state.isLoading && (
              <div className="text-center py-20 lg:py-32">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200">
                  <i className="fa-solid fa-microscope text-3xl text-white"></i>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
                  Deep <span className="gradient-text">Academic Synthesis</span>
                </h1>
                <p className="text-lg lg:text-xl text-slate-500 max-w-lg mx-auto leading-relaxed mb-12 font-medium">
                  Autonomous research engine for multidimensional data analysis and verified lit reviews.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                   <div className="p-4 rounded-2xl border border-slate-200 bg-white text-left">
                     <i className="fa-solid fa-bolt text-blue-500 mb-2"></i>
                     <h3 className="text-xs font-black uppercase mb-1">High Velocity</h3>
                     <p className="text-[10px] text-slate-400 leading-normal">Optimized for complex extraction</p>
                   </div>
                   <div className="p-4 rounded-2xl border border-slate-200 bg-white text-left">
                     <i className="fa-solid fa-earth-americas text-green-500 mb-2"></i>
                     <h3 className="text-xs font-black uppercase mb-1">Grounding</h3>
                     <p className="text-[10px] text-slate-400 leading-normal">Verifiable live source integration</p>
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-10">
              {state.isLoading && (
                <div className="bg-white rounded-[2.5rem] p-20 shadow-xl border border-slate-200 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
                     <div className="h-full bg-blue-600 w-1/3 animate-[loading_1.5s_infinite_linear]"></div>
                   </div>
                   <div className="space-y-4">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-2">
                       <i className="fa-solid fa-atom fa-spin text-2xl"></i>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Neural Synthesis</h3>
                     <p className="text-slate-400 text-sm max-w-xs mx-auto">Running advanced reasoning filters and cross-referencing global indices...</p>
                   </div>
                </div>
              )}
              
              {state.error && (
                <div className="bg-red-50 text-red-700 p-6 rounded-3xl border border-red-100 flex items-start space-x-4 animate-in fade-in zoom-in">
                  <i className="fa-solid fa-circle-exclamation text-xl mt-0.5"></i>
                  <div>
                    <h4 className="font-black text-xs uppercase mb-1">System Alert</h4>
                    <p className="text-sm font-medium">{state.error}</p>
                  </div>
                </div>
              )}

              {state.history.map((item, idx) => <ResearchCard key={idx} data={item} />)}
              <div ref={resultsEndRef} />
            </div>
          </div>
        </main>

        {/* Input Footer */}
        <footer className="p-8 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2 overflow-x-auto pb-4 mb-2 no-scrollbar scroll-smooth">
              {QUICK_PROMPTS.map((p) => (
                <button 
                  key={p.label} 
                  onClick={() => setQuery(p.text)} 
                  className="px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-[11px] font-bold whitespace-nowrap active:scale-95"
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
                placeholder={isRecording ? "Neural core listening..." : "Describe research objective..."} 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] pl-10 pr-44 py-7 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xl font-medium shadow-sm" 
              />
              <div className="absolute inset-y-3 right-3 flex space-x-3">
                <button 
                  type="button" 
                  onClick={toggleRecording} 
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isRecording ? 'bg-red-500 text-white animate-pulse border-red-600' : 'bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-400'}`}
                >
                  <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
                </button>
                <button 
                  type="submit" 
                  disabled={state.isLoading || !query.trim()} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-[1.5rem] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-200 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95"
                >
                  {state.isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Synthesize"}
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Grounded Reference Architecture &bull; Neural Inference Ready
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
