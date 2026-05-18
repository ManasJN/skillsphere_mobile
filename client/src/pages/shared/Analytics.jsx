import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Layout } from '../../components/layout';
import { StatCard, Spinner } from '../../components/ui';
import { analyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#64748b', '#10b981', '#94a3b8', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#10192f] border border-[#1e293b] px-3 py-2 text-xs">
      <div className="text-[#94a3b8] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { isStaff } = useAuth();
  const [myStats,    setMyStats]    = useState(null);
  const [overview,   setOverview]   = useState(null);
  const [skillDist,  setSkillDist]  = useState([]);
  const [aspirations,setAspirations]= useState([]);
  const [coding,     setCoding]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const calls = [
      analyticsAPI.myStats(),
      analyticsAPI.skillsDistribution(),
      analyticsAPI.aspirations(),
      analyticsAPI.codingActivity(),
    ];
    if (isStaff) calls.push(analyticsAPI.overview());

    Promise.all(calls)
      .then(results => {
        setMyStats(results[0].data.data);
        setSkillDist(results[1].data.data);
        setAspirations(results[2].data.data);
        setCoding(results[3].data.data);
        if (results[4]) setOverview(results[4].data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isStaff]);

  if (loading) return (
    <Layout title="Analytics">
      <div className="flex justify-center mt-24"><Spinner size={36} /></div>
    </Layout>
  );

  return (
    <Layout title="Analytics">
      <p className="page-intro">
        Charts and counts from student activity. Some sections only appear if data exists in the database.
      </p>

      {myStats && (
        <>
          <p className="section-label">My stats</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total skills" value={myStats.totalSkills} />
            <StatCard label="Avg skill level" value={`${myStats.avgSkillLevel}%`} className="card-offset" />
            <StatCard label="Goals done" value={myStats.completedGoals} />
            <StatCard label="Projects" value={myStats.totalProjects} />
          </div>
        </>
      )}

      {overview && (
        <>
          <p className="section-label">Platform overview</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total students" value={overview.totalStudents} />
            <StatCard label="Active students" value={overview.activeStudents} className="card-offset" />
            <StatCard label="Skills tracked" value={overview.totalSkills?.toLocaleString()} />
            <StatCard label="Goal completion" value={`${overview.goalCompletionRate}%`} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {skillDist.length > 0 && (
          <div className="card">
            <div className="section-title mb-4">Skills by category</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skillDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aspirations.length > 0 && (
          <div className="card border-[#253552]">
            <div className="section-title mb-4">Aspirations</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={aspirations} dataKey="count" cx="50%" cy="50%" outerRadius={70} stroke="none">
                    {aspirations.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {aspirations.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-[#94a3b8] flex-1 truncate">{a.aspiration}</span>
                    <span className="text-xs font-mono text-[#64748b]">{a.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {coding?.summary && (
        <div className="card">
          <div className="section-title mb-4">Coding activity</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total LC solved', value: coding.summary.totalLCSolved || 0 },
              { label: 'Avg LC solved', value: Math.round(coding.summary.avgLCSolved || 0) },
              { label: 'Avg CF rating', value: Math.round(coding.summary.avgCFRating || 0) },
              { label: 'GH contributions', value: coding.summary.totalGHContrib || 0 },
              { label: 'Students on LC', value: coding.summary.studentsOnLC || 0 },
              { label: 'Students on CF', value: coding.summary.studentsOnCF || 0 },
            ].map((s, i) => (
              <div key={i} className="card-sm text-center py-3">
                <div className="text-lg font-bold font-mono text-white">{s.value.toLocaleString()}</div>
                <div className="text-[10px] text-[#64748b] mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
