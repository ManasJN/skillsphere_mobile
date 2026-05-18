import React from 'react';
import { Badge } from '../ui';

const priorityVariant = (p) => {
  if (p === 'high' || p === 'now') return 'red';
  if (p === 'medium' || p === 'soon') return 'amber';
  return 'indigo';
};

export const RecommendationCard = ({ title, subtitle, why, priority, children, className = '' }) => (
  <div className={`card border-[#1e293b] hover:border-[#334155] transition-colors ${className}`}>
    <div className="flex items-start justify-between gap-3 mb-2">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
      </div>
      {priority && (
        <Badge variant={priorityVariant(priority)} className="text-[10px] capitalize flex-shrink-0">
          {priority}
        </Badge>
      )}
    </div>
    {why && (
      <p className="text-xs text-[#94a3b8] leading-relaxed mb-3 border-l-2 border-[#4f46e5] pl-3">
        <span className="text-[#64748b]">Why: </span>
        {why}
      </p>
    )}
    {children}
  </div>
);

export const SectionBlock = ({ label, children, className = '' }) => (
  <section className={className}>
    <h2 className="section-label">{label}</h2>
    {children}
  </section>
);
