import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/layout';
import { Button, Spinner, Tabs } from '../../components/ui';
import CareerGuidanceForm from '../../components/recommendations/CareerGuidanceForm';
import RecommendationResults from '../../components/recommendations/RecommendationResults';
import { RecommendationSkeleton } from '../../components/recommendations/RecommendationSkeleton';
import { recommendationsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const [tab, setTab] = useState('report');
  const [profile, setProfile] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingRec, setLoadingRec] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const res = await recommendationsAPI.getProfile();
      setProfile(res.data.data);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoadingRec(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        recommendationsAPI.getLatest(),
        recommendationsAPI.getHistory({ limit: 8 }),
      ]);
      setLatest(latestRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch {
      setLatest(null);
      setHistory([]);
    } finally {
      setLoadingRec(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadRecommendations();
  }, [loadProfile, loadRecommendations]);

  const handleSaveAndGenerate = async (formData) => {
    setGenerating(true);
    try {
      await recommendationsAPI.saveProfile(formData);
      setProfile(formData);
      const gen = await recommendationsAPI.generate();
      setLatest(gen.data.data);
      setTab('report');
      toast.success('Recommendations updated from your latest profile');
      loadRecommendations();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const loadHistoryItem = async (id) => {
    try {
      const res = await recommendationsAPI.getById(id);
      setLatest(res.data.data);
      setTab('report');
    } catch {
      toast.error('Could not load that report');
    }
  };

  const regenerateOnly = async () => {
    setGenerating(true);
    try {
      const gen = await recommendationsAPI.generate();
      setLatest(gen.data.data);
      toast.success('Regenerated using your current SkillSphere data');
      loadRecommendations();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout title="Career recommendations">
      <p className="page-intro">
        Answer a few questions, then we analyze your skills, goals, projects, and coding stats
        to suggest courses, career paths, and a practical roadmap. Suggestions are rule-based
        today and can connect to an AI service later.
      </p>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={[
            { value: 'report', label: 'Your report' },
            { value: 'inputs', label: 'Career inputs' },
            { value: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {latest && tab === 'report' && (
          <Button variant="ghost" className="text-xs" onClick={regenerateOnly} loading={generating}>
            Refresh from platform data
          </Button>
        )}
      </div>

      {tab === 'inputs' && (
        loadingProfile ? (
          <RecommendationSkeleton />
        ) : (
          <CareerGuidanceForm
            initial={profile}
            onSubmit={handleSaveAndGenerate}
            loading={generating}
          />
        )
      )}

      {tab === 'report' && (
        loadingRec ? (
          <RecommendationSkeleton />
        ) : latest ? (
          <RecommendationResults data={latest} />
        ) : (
          <div className="card text-center py-12">
            <p className="text-sm text-[#94a3b8] mb-4 max-w-md mx-auto">
              No report yet. Fill in career inputs and generate your first personalized plan.
            </p>
            <Button variant="primary" onClick={() => setTab('inputs')}>
              Go to career inputs
            </Button>
          </div>
        )
      )}

      {tab === 'history' && (
        <div className="card">
          {history.length === 0 ? (
            <p className="text-sm text-[#64748b] py-6 text-center">No past reports yet.</p>
          ) : (
            <ul className="divide-y divide-[#1e293b]">
              {history.map((h) => (
                <li key={h._id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#94a3b8] line-clamp-2">{h.summary}</p>
                    <p className="text-[10px] text-[#64748b] mt-1">
                      {new Date(h.createdAt).toLocaleString()}
                      {h.profileSnapshot?.preferredDomain && (
                        <> · {h.profileSnapshot.preferredDomain}</>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" className="text-xs shrink-0" onClick={() => loadHistoryItem(h._id)}>
                    View
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Layout>
  );
}
