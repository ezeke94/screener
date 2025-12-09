import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-[#1a2b4b] border-b border-indigo-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           {/* Logo container with white background for better visibility if needed, or directly on dark */}
           <div className="h-10 w-auto bg-white/10 rounded px-2 py-1 backdrop-blur-sm">
             <img 
               src="https://fees.talcworld.com/static/media/logo-light.6d227ed7ba1a9e559495.png" 
               alt="TALC - PHYSIS Logo" 
               className="h-full object-contain"
             />
           </div>
           <div className="text-white">
             <h1 className="text-xl font-bold tracking-tight">Photo Screener</h1>
             <p className="text-xs text-indigo-200">Quality Control for Mentors</p>
           </div>
        </div>
        
        <div className="hidden sm:block">
           <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-100 text-xs border border-indigo-500/30">
             Internal Use Only
           </span>
        </div>
      </div>
    </header>
  );
};
