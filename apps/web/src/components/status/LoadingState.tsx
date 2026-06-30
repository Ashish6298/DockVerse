import React from 'react';

export function LoadingState() {
  const skeletonCards = Array.from({ length: 8 });

  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-border/40">
        <div>
          <div className="h-6 w-48 bg-slate-800 rounded"></div>
          <div className="h-4 w-64 bg-slate-800/60 rounded mt-2"></div>
        </div>
        <div className="h-9 w-24 bg-slate-800 rounded"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skeletonCards.map((_, index) => (
          <div key={index} className="bg-card border border-border/40 rounded-lg p-5 h-32 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                <div className="h-6 w-20 bg-slate-800 rounded"></div>
              </div>
              <div className="w-9 h-9 bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-3 w-3/4 bg-slate-800/60 rounded mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default LoadingState;
