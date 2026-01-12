
import React from 'react';
import { ResearchResponse } from '../types';

interface ResearchCardProps {
  data: ResearchResponse;
}

const ResearchCard: React.FC<ResearchCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-600 text-[10px] font-black text-white px-2 py-0.5 rounded tracking-tighter uppercase">Verified</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.timestamp}</span>
        </div>
        <div className="flex space-x-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 transition-colors">
            <i className="fa-solid fa-copy text-sm"></i>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 transition-colors">
            <i className="fa-solid fa-download text-sm"></i>
          </button>
        </div>
      </div>
      
      <div className="p-10">
        <article className="prose prose-slate max-w-none">
          <div className="text-slate-800 leading-[1.8] font-serif text-xl space-y-6">
            {/* Split by double newlines for paragraph spacing */}
            {data.content.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>
        </article>
      </div>

      {data.sources.length > 0 && (
        <div className="px-10 pb-10">
          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 mb-4 flex items-center uppercase tracking-[0.2em]">
              References & Citations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mr-3 flex-shrink-0 group-hover:border-blue-300">
                    <i className="fa-solid fa-file-lines text-slate-400 group-hover:text-blue-500 text-xs"></i>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">
                      {source.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {source.uri}
                    </p>
                  </div>
                  <i className="fa-solid fa-external-link text-[10px] text-slate-300 ml-auto group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 pr-1"></i>
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
