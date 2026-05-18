import React from 'react';

export const RecommendationSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="card h-24 bg-[#10192f]" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card h-40 bg-[#10192f]" />
      <div className="card h-40 bg-[#10192f]" />
    </div>
    <div className="card h-56 bg-[#10192f]" />
    <div className="card h-48 bg-[#10192f]" />
  </div>
);

export const CardSkeleton = ({ className = 'h-32' }) => (
  <div className={`card ${className} animate-pulse bg-[#10192f] border-[#1e293b]`} />
);
