
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
  [ResearchMode.SYNTHESIS]: {
    label: 'Synthesis',
    description: 'Combines findings from multiple sources into a coherent overview.',
    icon: 'fa-vials'
  },
  [ResearchMode.LIT_REVIEW]: {
    label: 'Lit Review',
    description: 'Structured outline of key thematic clusters and citations.',
    icon: 'fa-book-open'
  },
  [ResearchMode.CRITICAL_ANALYSIS]: {
    label: 'Critical Analysis',
    description: 'Evaluates methodologies, assumptions, and bias in existing work.',
    icon: 'fa-magnifying-glass-chart'
  },
  [ResearchMode.HYPOTHESIS_GEN]: {
    label: 'Hypothesis Gen',
    description: 'Predicts novel testable research directions based on literature gaps.',
    icon: 'fa-lightbulb'
  }
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
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await performResearch(currentQuery, mode);
      const resultWithQuery = { 
        ...result, 
        query: currentQuery, 
        fullDate: new Date().toLocaleDateString() 
      } as any;
      
      setState(prev => ({
        ...prev,
        history: [resultWithQuery, ...prev.history],
        isLoading: false
      }));
      setQuery('');
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'The AI service is currently at capacity. Please try again shortly.'
      }));
    }
  }, [query, mode]);

  const clearHistory = () => {
    if (window.confirm('Clear all research history?')) {
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const handleQuickPrompt = (text: string) => {
    setQuery(text);
    const input = document.getElementById('research-input');
    input?.focus();
  };

  const restoreQuery = (text: string) => {
    setQuery(text);
    const input = document.getElementById('research-input');
    input?.focus();
    // Smooth scroll to input area if on mobile/smaller screens
    if (window.innerWidth < 1024) {
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return state.history;
    return state.history.filter((item: any) => 
      item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [state.history, searchQuery]);

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col z-50`}
      >
        <div className="p-4 border-b border-slate-100 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center text-sm">
              <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-500"></i>
              Research Archive
            </h2>
            <button onClick={clearHistory} className="text-slate-400 hover:text-red-500 transition-colors text-xs">
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search past sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-w-[320px]">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="fa-solid fa-folder-open mb-3 text-2xl opacity-20"></i>
              <p className="text-xs">{searchQuery ? 'No matching research found.' : 'History is empty.'}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredHistory.map((item: any, idx) => (
                <div 
                  key={idx} 
                  onClick={() => restoreQuery(item.query)}
                  className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-blue-100 transition-all group relative overflow-hidden"
                >
                  <div className="text-[10px] font-bold text-blue-600 mb-1 flex justify-between">
                    <span>{item.timestamp} <span className="text-slate-300 font-normal ml-1">· {item.fullDate}</span></span>
                    <i className="fa-solid fa-rotate-left opacity-0 group-hover:opacity-100 transition-opacity text-blue-400"></i>
                  </div>
                  <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed group-hover:text-blue-900 transition-colors">{item.query}</p>
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 min-w-[320px]">
          <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            Powered by Gemini 3 Pro
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <nav className="glass-effect px-6 py-3 flex items-center justify-between border-b border-slate-200 z-30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <i className={`fa-solid ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'} text-lg`}></i>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <i className="fa-solid fa-atom text-sm"></i>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">ScholarPulse<span className="text-blue-600">AI</span></span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {Object.entries(MODE_DETAILS).map(([m, detail]) => (
              <div key={m} className="relative group">
                <button
                  onClick={() => setMode(m as ResearchMode)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center ${
                    mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <i className={`fa-solid ${detail.icon} mr-1.5 text-[10px]`}></i>
                  {detail.label}
                </button>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-slate-900 text-white rounded-xl text-[10px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl border border-slate-800">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 border-4 border-transparent border-b-slate-900"></div>
                  <p className="font-bold text-blue-400 mb-1 uppercase tracking-wider">{detail.label} Mode</p>
                  {detail.description}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto w-full">
            {state.history.length === 0 && !state.isLoading && (
              <div className="text-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 inline-block">Free Academic Tier</span>
                <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                  High-Quality <span className="gradient-text">Research Intelligence</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed mb-12 font-light">
                  Free access to PhD-level synthesis using Google's most advanced Pro models.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-globe text-xl"></i>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Web Grounding</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">Integrated Google Search to fetch the latest academic pre-prints and journals.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 transition-all group">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-brain text-xl"></i>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Reasoning Engine</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">Leverages advanced thinking budgets for deep methodological audits.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {state.isLoading && (
                <div className="bg-white rounded-[2.5rem] p-16 shadow-xl border border-slate-200 text-center animate-pulse">
                  <div className="relative w-20 h-20 mx-auto mb-8">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                    <div className="relative w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-atom fa-spin text-blue-600 text-3xl"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Generating Insight...</h3>
                  <p className="text-slate-400 text-sm mt-3 uppercase font-bold tracking-[0.3em]">Accessing Pro Knowledge Index</p>
                </div>
              )}

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-