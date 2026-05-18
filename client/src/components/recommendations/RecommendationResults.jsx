import React from 'react';
import { RecommendationCard, SectionBlock } from './RecommendationCard';
import { Badge, ProgressBar } from '../ui';

const trendLabel = { up: 'On track', flat: 'Steady', 'needs-work': 'Needs attention' };
const trendColor = { up: '#10b981', flat: '#94a3b8', 'needs-work': '#f59e0b' };

export default function RecommendationResults({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="card border-[#253552] bg-[#0b1630]">
        <p className="text-sm text-[#94a3b8] leading-relaxed">{data.summary}</p>
        <p className="text-[10px] text-[#64748b] mt-3">
          Generated {new Date(data.createdAt).toLocaleString()} · {data.engineVersion || 'rule-based'}
        </p>
      </div>

      <SectionBlock label="Priority focus">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data.priorityAreas || []).map((p, i) => (
            <RecommendationCard key={i} title={p.area} why={p.reason} priority={p.urgency} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Progress insights">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(data.progressInsights || []).map((ins, i) => (
            <div key={i} className="card-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white">{ins.metric}</span>
                <span className="text-[10px]" style={{ color: trendColor[ins.trend] || trendColor.flat }}>
                  {trendLabel[ins.trend] || ins.trend}
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{ins.insight}</p>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Skills to improve">
        <div className="space-y-3">
          {(data.skillsToImprove || []).map((s, i) => (
            <RecommendationCard
              key={i}
              title={s.name}
              subtitle={s.currentGap}
              why={s.why}
              priority={s.priority}
            >
              {s.targetLevel != null && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
                    <span>Suggested target</span>
                    <span>{s.targetLevel}%</span>
                  </div>
                  <ProgressBar pct={s.targetLevel} color="#4f46e5" height={4} animate={false} />
                </div>
              )}
            </RecommendationCard>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Weakness analysis">
        <div className="space-y-2">
          {(data.weaknessAnalysis || []).map((w, i) => (
            <div key={i} className="card-sm flex gap-3 items-start">
              <Badge variant={w.severity === 'high' ? 'red' : w.severity === 'medium' ? 'amber' : 'indigo'} className="text-[10px] mt-0.5">
                {w.severity}
              </Badge>
              <div>
                <div className="text-sm font-medium text-white">{w.area}</div>
                <p className="text-xs text-[#94a3b8] mt-1">{w.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Recommended courses">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {(data.courses || []).map((c, i) => (
            <RecommendationCard key={i} title={c.title} subtitle={c.provider} why={c.why} priority={c.priority}>
              {c.estimatedWeeks && (
                <p className="text-[11px] text-[#64748b]">Rough timeline: {c.estimatedWeeks} weeks</p>
              )}
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-[#93c5fd] hover:underline mt-2 inline-block">
                  View resource
                </a>
              )}
            </RecommendationCard>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Career paths">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.careerPaths || []).map((c, i) => (
            <RecommendationCard key={i} title={c.title} subtitle={c.fitLabel} why={c.why}>
              <p className="text-xs text-[#94a3b8]">{c.description}</p>
            </RecommendationCard>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Improvement roadmap">
        <div className="space-y-3">
          {(data.roadmap || []).map((phase, i) => (
            <div key={i} className="card-sm border-l-2 border-[#4f46e5] pl-4">
              <div className="flex flex-wrap gap-2 items-baseline mb-2">
                <span className="text-xs font-mono text-[#93c5fd]">Phase {phase.phase}</span>
                <span className="text-sm font-semibold text-white">{phase.title}</span>
                <span className="text-[11px] text-[#64748b]">{phase.timeframe}</span>
              </div>
              <ul className="list-disc list-inside text-xs text-[#94a3b8] space-y-1">
                {(phase.tasks || []).map((t, j) => (
                  <li key={j}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Technologies to learn">
        <div className="flex flex-wrap gap-2">
          {(data.technologies || []).map((t, i) => (
            <div key={i} className="card-sm max-w-xs">
              <span className="text-xs font-mono text-[#64748b] mr-2">#{t.order}</span>
              <span className="text-sm font-medium text-white">{t.name}</span>
              <p className="text-[11px] text-[#94a3b8] mt-1">{t.why}</p>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock label="Tips">
        <ul className="card space-y-2 list-none p-5">
          {(data.tips || []).map((tip, i) => (
            <li key={i} className="text-sm text-[#94a3b8] leading-relaxed border-b border-[#1e293b] pb-2 last:border-0 last:pb-0">
              {tip}
            </li>
          ))}
        </ul>
      </SectionBlock>

      <SectionBlock label="Future opportunities">
        <div className="space-y-3">
          {(data.futureOpportunities || []).map((o, i) => (
            <RecommendationCard key={i} title={o.title} why={o.why}>
              <p className="text-xs text-[#94a3b8]">{o.description}</p>
            </RecommendationCard>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
