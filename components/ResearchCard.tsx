
import React, { useState } from 'react';
import { ResearchResponse } from '../types';

interface ResearchCardProps {
  data: ResearchResponse;
}

const ResearchCard: React.FC<ResearchCardProps> = ({ data }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isWideRatio, setIsWideRatio] = useState(true);

  const primarySource = data.sources && data.sources.length > 0 ? data.sources[0] : null;

  const handleDownloadMarkdown = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Research-Findings-${timestamp}.md`;
    
    const sourceLinks = data.sources
      .map(s => `- [${s.title}](${s.uri})`)
      .join('\n');
      
    const fileContent = `# ScholarPulse Research Findings\n\n` +
      `**Generated on:** ${data.timestamp}\n\n` +
      `## Analysis\n\n${data.content}\n\n` +
      `## References\n\n${sourceLinks || 'No external references cited.'}`;

    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = () => {
    if (!data.imageUrl) return;
    const link = document.createElement('a');
    link.href = data.imageUrl;
    link.download = `Neural-Synthesis-${data.timestamp.replace(/[: ]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.content);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500 transition-colors">
      {/* Visual Header */}
      {data.imageUrl && (
        <div className={`group relative w-full transition-all duration-700 overflow-hidden border-b border-slate-100 dark:border-slate-800 ${isWideRatio ? 'aspect-video md:aspect-[21/9]' : 'aspect-video'}`}>
          <img 
            src={data.imageUrl} 
            alt="Contextual Research Visual" 
            className="w-full h-full object-cover grayscale-[15%] brightness-[0.85] group-hover:grayscale-0 group-hover:brightness-105 group-hover:scale-[1.03] transition-all duration-1000 ease-out cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
          />
          
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {primarySource && (
              <a 
                href={primarySource.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black text-white shadow-lg flex items-center hover:bg-blue-700 transition-all translate-y-[-12px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300 delay-75"
                title={`Visit Primary Source: ${primarySource.title}`}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="fa-solid fa-link mr-2"></i>
                Source
              </a>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsWideRatio(!isWideRatio); }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-700 flex items-center hover:bg-white dark:hover:bg-slate-700 transition-all translate-y-[-12px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300 delay-150"
              title="Toggle Aspect Ratio"
            >
              <i className={`fa-solid ${isWideRatio ? 'fa-arrows-left-right' : 'fa-expand'} mr-2`}></i>
              {isWideRatio ? '21:9' : '16:9'}
            </button>
            <button 
              onClick={() => setIsLightboxOpen(true)}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all translate-y-[-12px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300 delay-200"
            >
              <i className="fa-solid fa-maximize text-xs"></i>
            </button>
          </div>

          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-1000"></div>
          <div className="absolute bottom-4 left-6 flex items-center space-x-2 z-10 transition-all duration-700 group-hover:translate-x-2">
            <span className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-[9px] font-black text-slate-900 dark:text-slate-100 px-2.5 py-1.5 rounded-md shadow-xl uppercase tracking-[0.15em] border border-slate-200/50 dark:border-slate-700 transition-all group-hover:border-blue-300/50">
              Neural Visualization
            </span>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="flex justify-between items-center p-6 text-white border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Full-Scale Examination</h3>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">1:1 High-Fidelity Synthesis</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5">
                <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="w-6 h-6 flex items-center justify-center hover:text-blue-400 transition-colors"><i className="fa-solid fa-minus text-xs"></i></button>
                <span className="text-[10px] font-mono w-14 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
                <button onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} className="w-6 h-6 flex items-center justify-center hover:text-blue-400 transition-colors"><i className="fa-solid fa-plus text-xs"></i></button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleDownloadImage}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all shadow-xl shadow-blue-900/30 active:scale-95"
              >
                <i className="fa-solid fa-download mr-2 text-xs"></i> Export High-Res Asset
              </button>
              <button 
                onClick={() => { setIsLightboxOpen(false); setZoomLevel(1); }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 group"
              >
                <i className="fa-solid fa-xmark text-lg transition-transform group-hover:rotate-90"></i>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-950">
            <img 
              src={data.imageUrl} 
              alt="Expanded Research Visual" 
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-sm"
            />
          </div>

          <div className="p-4 flex justify-center border-t border-white/10 bg-black/40">
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.25em] text-center">
               {primarySource ? `Verified Grounding: ${primarySource.title}` : 'Advanced Synthetic Imagery • Interactive Exploration Mode'}
             </p>
          </div>
        </div>
      )}

      <div className="bg-slate-50/50 dark:bg-slate-800/30 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-600 text-[10px] font-black text-white px-2 py-0.5 rounded tracking-tighter uppercase">Verified</span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{data.timestamp}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopy}
            title="Copy to clipboard"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors active:scale-90"
          >
            <i className="fa-solid fa-copy text-sm"></i>
          </button>
          <button 
            onClick={handleDownloadMarkdown}
            title="Download as Markdown"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors active:scale-90"
          >
            <i className="fa-solid fa-download text-sm"></i>
          </button>
        </div>
      </div>
      
      <div className="p-10">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <div className="text-slate-800 dark:text-slate-300 leading-[1.8] font-serif text-xl space-y-6 whitespace-pre-wrap">
            {data.content}
          </div>
        </article>
      </div>

      {data.sources.length > 0 && (
        <div className="px-10 pb-10">
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-4 flex items-center uppercase tracking-[0.3em]">
              Primary Grounding Sources
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center p-3 rounded-2xl border transition-all ${idx === 0 ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/5'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 border transition-all ${idx === 0 ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-blue-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    <i className={`fa-solid ${idx === 0 ? 'fa-star' : 'fa-file-lines'} text-[10px]`}></i>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs font-bold truncate transition-colors ${idx === 0 ? 'text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`}>
                        {source.title}
                      </p>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors"></i>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                      {source.uri}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchCard;
