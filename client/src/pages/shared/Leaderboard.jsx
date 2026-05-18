import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { Avatar, Badge, Spinner, Tabs } from '../../components/ui';
import { leaderboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEPARTMENT_FILTERS = ['ALL', 'CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState([]);
  const [myRank,  setMyRank]  = useState(null);
  const [type,    setType]    = useState('xp');
  const [dept,    setDept]    = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    leaderboardAPI
      .get({ type, dept: dept === 'ALL' ? undefined : dept, limit: 30 })
      .then(r => { setData(r.data.data); setMyRank(r.data.myRank); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, dept]);

  const rankLabel = i => {
    if (i === 0) return '1st';
    if (i === 1) return '2nd';
    if (i === 2) return '3rd';
    return `${i + 1}`;
  };

  return (
    <Layout title="Leaderboard">
      <p className="page-intro">
        Rankings by department and metric. Switch tabs to compare XP, CGPA, or coding stats.
      </p>

      {myRank && (
        <div className="card mb-5 flex items-center gap-4 border-[#253552]">
          <div>
            <div className="font-semibold text-sm text-white">Your rank</div>
            <div className="text-xs text-[#64748b]">#{myRank} on the {type} board</div>
          </div>
          <div className="ml-auto text-2xl font-bold font-mono text-[#93c5fd]">#{myRank}</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <Tabs
          tabs={[
            { value: 'xp',         label: 'XP' },
            { value: 'cgpa',       label: 'CGPA' },
            { value: 'leetcode',   label: 'LeetCode' },
            { value: 'codeforces', label: 'CF Rating' },
          ]}
          active={type}
          onChange={setType}
        />
        <div className="flex gap-1 flex-wrap">
          {DEPARTMENT_FILTERS.map(d => (
            <button key={d} onClick={() => setDept(d)}
              className={`px-3 py-1.5 text-xs font-semibold transition-all border cursor-pointer
                ${dept === d
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-[#081225] text-[#64748b] border-[#1e293b] hover:text-[#94a3b8]'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading
          ? <div className="flex justify-center py-16"><Spinner size={32} /></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#111c35]">
                    {['Rank', 'Student', 'Dept', 'CGPA', 'LeetCode', 'CF Rating', 'XP', 'Aspiration'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wide text-[#64748b] font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((s, i) => (
                    <tr
                      key={s._id}
                      className={`border-b border-[#1e293b] hover:bg-[#0b1630] transition-colors
                        ${s._id === user?._id ? 'bg-[#4f46e5]/5' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <span className={`text-sm font-semibold ${i < 3 ? 'text-[#93c5fd]' : 'text-[#64748b]'}`}>
                          {rankLabel(i)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size={32} />
                          <div>
                            <div className="font-medium text-sm text-[#f8fafc]">{s.name}</div>
                            <div className="text-[10px] text-[#64748b]">{s.rollNumber || s.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="indigo" className="text-[10px]">{s.department}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold font-mono text-sm text-[#f8fafc]">{s.cgpa || '—'}</td>
                      <td className="py-3 px-4 text-sm text-[#94a3b8] font-mono">{s.codingStats?.leetcodeSolved || 0}</td>
                      <td className="py-3 px-4 text-sm text-[#94a3b8] font-mono">{s.codingStats?.codeforcesRating || '—'}</td>
                      <td className="py-3 px-4 font-semibold font-mono text-sm text-[#93c5fd]">{s.xpPoints?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant="purple" className="text-[10px]">{s.aspiration}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </Layout>
  );
}
