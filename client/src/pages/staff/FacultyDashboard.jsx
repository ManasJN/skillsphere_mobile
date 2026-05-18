import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Avatar, Badge, Button, Spinner, StatCard, EmptyState } from '../../components/ui';
import { usersAPI } from '../../services/api';
import { useDebounce } from '../../hooks';

const DEPARTMENTS = ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER'];

export default function FacultyDashboard() {
  const [students, setStudents]   = useState([]);
  const [total,    setTotal]      = useState(0);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [dept,     setDept]       = useState('');
  const [aspiration, setAspiration] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    usersAPI.getAll({
      role:       'student',
      search:     debouncedSearch || undefined,
      dept:       dept        || undefined,
      aspiration: aspiration  || undefined,
      limit: 40,
    })
      .then(r => { setStudents(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, dept, aspiration]);

  const avgCGPA = students.length
    ? (students.reduce((s, u) => s + (u.cgpa || 0), 0) / students.length).toFixed(2)
    : '—';

  return (
    <Layout title="Faculty Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total students" value={total} />
        <StatCard label="Avg CGPA" value={avgCGPA} className="card-offset" />
        <StatCard label="Active coders" value={students.filter(s => (s.codingStats?.leetcodeSolved || 0) > 50).length} />
        <StatCard label="High CGPA (9+)" value={students.filter(s => s.cgpa >= 9).length} />
      </div>

      {/* Directory */}
      <div className="card">
        <div className="section-title mb-4">Student directory</div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll number, email..."
            className="input flex-1 min-w-52"
          />
          <select value={dept} onChange={e => setDept(e.target.value)} className="input w-36">
            <option value="">All Depts</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={aspiration} onChange={e => setAspiration(e.target.value)} className="input w-44">
            <option value="">All Aspirations</option>
            {['Placements', 'GATE', 'Higher Studies', 'Startup', 'Research', 'Government', 'Freelancing'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {loading
          ? <div className="flex justify-center py-12"><Spinner size={28} /></div>
          : students.length === 0
            ? <EmptyState title="No students found" desc="Try adjusting the filters" />
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {['Student', 'Dept', 'Sem', 'CGPA', 'Aspiration', 'LeetCode', 'CF', 'XP', ''].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-[.7px] text-[#475569] font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <motion.tr
                        key={s._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-[#1e2d4a] last:border-0 hover:bg-[#0b1630] transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} size={30} />
                            <div>
                              <div className="font-semibold text-sm text-[#f1f5f9]">{s.name}</div>
                              <div className="text-[10px] text-[#475569]">{s.rollNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3"><Badge variant="indigo" className="text-[10px]">{s.department}</Badge></td>
                        <td className="py-3 px-3 text-sm text-[#94a3b8]">{s.semester}</td>
                        <td className="py-3 px-3 font-bold text-emerald font-mono text-sm">{s.cgpa || '—'}</td>
                        <td className="py-3 px-3"><Badge variant="purple" className="text-[10px]">{s.aspiration}</Badge></td>
                        <td className="py-3 px-3 font-mono text-sm text-[#94a3b8]">{s.codingStats?.leetcodeSolved || 0}</td>
                        <td className="py-3 px-3 font-mono text-sm text-[#94a3b8]">{s.codingStats?.codeforcesRating || '—'}</td>
                        <td className="py-3 px-3 font-bold text-amber font-mono text-sm">{s.xpPoints?.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <Link to={`/students/${s._id}`}>
                            <Button variant="ghost" className="text-[11px] py-1 px-2.5">View →</Button>
                          </Link>
                        </td>
                      </motion.tr>
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
