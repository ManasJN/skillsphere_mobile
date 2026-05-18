import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsAPI } from '../../services/api';
import { Button, Spinner } from '../ui';

export default function DashboardRecommendationWidget() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationsAPI
      .getDashboardSummary()
      .then((r) => setSummary(r.data.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card border-[#253552]">
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="card border-[#253552]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="section-title">Career guidance</h3>
          <p className="text-xs text-[#64748b] mt-1">
            Personalized paths based on your profile and activity
          </p>
        </div>
        <Link to="/recommendations">
          <Button variant="ghost" className="text-xs py-1 px-3">Open</Button>
        </Link>
      </div>

      {summary?.hasRecommendations ? (
        <>
          <p className="text-sm text-[#94a3b8] leading-relaxed line-clamp-3 mb-3">
            {summary.summary}
          </p>
          {summary.nextSkill && (
            <div className="card-sm mb-3">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">Next focus</p>
              <p className="text-sm font-medium text-white">{summary.nextSkill.name}</p>
              <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">{summary.nextSkill.why}</p>
            </div>
          )}
          {summary.roadmapPhase && (
            <p className="text-xs text-[#64748b]">
              Roadmap: <span className="text-[#93c5fd]">{summary.roadmapPhase.title}</span>
              {' '}({summary.roadmapPhase.timeframe})
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">
          {summary?.profileComplete
            ? 'Generate recommendations from your career inputs.'
            : 'Tell us your interests and weak areas to get a tailored plan.'}
        </p>
      )}

      <Link to="/recommendations" className="inline-block mt-3">
        <Button variant="primary" className="text-xs">
          {summary?.hasRecommendations ? 'View full report' : 'Set up recommendations'}
        </Button>
      </Link>
    </div>
  );
}
