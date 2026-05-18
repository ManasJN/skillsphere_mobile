import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { Badge, Button, Spinner, StatCard, Modal, Input, Select } from '../../components/ui';
import { analyticsAPI, leaderboardAPI, opportunitiesAPI, collegesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../utils';
import toast from 'react-hot-toast';

const OPP_TYPES = ['Internship', 'Hackathon', 'Research', 'Competition', 'Workshop', 'Scholarship', 'Job'];
const BLANK_OPP = {
  title: '', company: '', type: 'Internship', deadline: '',
  description: '', requiredSkills: '', stipend: '',
  location: 'Remote', duration: '', minCGPA: 7, applyUrl: '',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview,  setOverview]  = useState(null);
  const [deptData,  setDeptData]  = useState([]);
  const [opps,      setOpps]      = useState([]);
  const [pendingColleges, setPendingColleges] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [oppForm,   setOppForm]   = useState(BLANK_OPP);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    Promise.all([
      analyticsAPI.overview(),
      leaderboardAPI.deptSummary(),
      opportunitiesAPI.getAll({ limit: 8 }),
      collegesAPI.adminPendingColleges(),
    ])
      .then(([ov, ds, op, colleges]) => {
        setOverview(ov.data.data);
        setDeptData(ds.data.data);
        setOpps(op.data.data);
        setPendingColleges(colleges.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setOppForm(p => ({ ...p, [k]: e.target.value }));

  const postOpportunity = async () => {
    if (!oppForm.title || !oppForm.company || !oppForm.deadline)
      return toast.error('Title, company and deadline are required');
    setSaving(true);
    try {
      const payload = {
        ...oppForm,
        minCGPA:       Number(oppForm.minCGPA),
        requiredSkills: oppForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        eligibleDepts: ['ALL'],
      };
      const res = await opportunitiesAPI.create(payload);
      setOpps(p => [res.data.data, ...p]);
      toast.success(`Posted. Notified ${res.data.notified || 0} matching students.`);
      setModal(false);
      setOppForm(BLANK_OPP);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post');
    } finally {
      setSaving(false);
    }
  };

  const deleteOpp = async (id) => {
    try {
      await opportunitiesAPI.delete(id);
      setOpps(p => p.filter(o => o._id !== id));
      toast.success('Opportunity removed');
    } catch { toast.error('Failed to delete'); }
  };

  const decideCollege = async (id, decision) => {
    try {
      await collegesAPI.adminDecideCollege(id, { decision });
      setPendingColleges(p => p.filter(c => c._id !== id));
      toast.success(decision === 'approved' ? 'College approved' : 'College rejected');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Decision failed');
    }
  };

  if (loading) return (
    <Layout title="Internal Admin">
      <div className="flex justify-center mt-24"><Spinner size={36} /></div>
    </Layout>
  );

  return (
    <Layout title="Admin Dashboard">
      {/* Platform overview */}
      {overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total students" value={overview.totalStudents} change={12} />
            <StatCard label="Active students" value={overview.activeStudents} className="card-offset" />
            <StatCard label="Goal completion" value={`${overview.goalCompletionRate}%`} change={8} />
            <StatCard label="Opportunities" value={overview.totalOpportunities} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card lg:col-span-2">
          <div className="section-title mb-4">Pending college approvals</div>
          {pendingColleges.length === 0 ? (
            <p className="text-sm text-[#64748b] py-3">No college accounts are waiting for approval.</p>
          ) : pendingColleges.map((college) => (
            <div key={college._id} className="card-sm mb-3 last:mb-0 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold text-sm">{college.collegeName}</div>
                <div className="text-xs text-[#64748b]">{college.officialEmail} · {college.website || 'No website provided'}</div>
                <div className="text-xs text-[#94a3b8] mt-1">
                  {college.authorizedRepresentative?.name} · {college.authorizedRepresentative?.designation}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="success" className="text-xs" onClick={() => decideCollege(college._id, 'approved')}>Approve</Button>
                <Button variant="danger" className="text-xs" onClick={() => decideCollege(college._id, 'rejected')}>Reject</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Department table */}
        {deptData.length > 0 && (
          <div className="card">
            <div className="section-title mb-4">Department performance</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d4a]">
                  {['Dept', 'Students', 'Avg CGPA', 'Avg LC', 'Active'].map(h => (
                    <th key={h} className="text-left py-2.5 px-2 text-[10px] uppercase tracking-[.7px] text-[#475569] font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptData.map((d, i) => (
                  <tr key={i} className="border-b border-[#1e2d4a] last:border-0">
                    <td className="py-2.5 px-2"><Badge variant="indigo" className="text-[10px]">{d.dept}</Badge></td>
                    <td className="py-2.5 px-2 text-sm text-[#94a3b8]">{d.total}</td>
                    <td className="py-2.5 px-2 font-bold text-emerald font-mono text-sm">{d.avgCgpa}</td>
                    <td className="py-2.5 px-2 font-mono text-sm text-[#94a3b8]">{d.avgLC}</td>
                    <td className="py-2.5 px-2 text-sm text-[#94a3b8]">{d.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Opportunities panel */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="section-title">Opportunities</span>
            <Button variant="primary" className="text-xs py-1.5" onClick={() => setModal(true)}>+ Post</Button>
          </div>
          {opps.length === 0
            ? <p className="text-sm text-[#475569] text-center py-6">No opportunities posted yet.</p>
            : opps.map((o, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1e2d4a] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{o.title}</div>
                  <div className="text-xs text-[#64748b]">{o.company} · Due {fmtDate(o.deadline)}</div>
                </div>
                <Badge variant="cyan" className="text-[10px] flex-shrink-0">{o.type}</Badge>
                <button
                  onClick={() => deleteOpp(o._id)}
                  className="text-[#475569] hover:text-rose text-sm transition-colors ml-1 cursor-pointer bg-transparent border-0"
                >×</button>
              </div>
            ))
          }
        </div>
      </div>

      {/* Aspirations breakdown */}
      <div className="card">
        <div className="section-title mb-4">Quick actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Broadcast announcement', action: () => toast('Use the Notifications page to broadcast') },
            { label: 'Post opportunity', action: () => setModal(true) },
            { label: 'Export student data', action: () => toast('Export feature — connect backend endpoint') },
            { label: 'View analytics', action: () => window.location.href = '/analytics' },
          ].map((a, i) => (
            <button key={i} onClick={a.action}
              className="card-sm flex flex-col items-start gap-1 py-4 px-3 cursor-pointer hover:border-[#334155] transition-colors text-left w-full">
              <span className="text-xs font-semibold text-[#94a3b8]">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Post opportunity modal */}
      <Modal open={modal} onClose={() => { setModal(false); setOppForm(BLANK_OPP); }} title="Post New Opportunity" width="max-w-xl">
        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Title *" placeholder="Google SWE Intern 2025" value={oppForm.title} onChange={set('title')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company *" placeholder="Google" value={oppForm.company} onChange={set('company')} />
            <Select label="Type" value={oppForm.type} onChange={set('type')}
              options={OPP_TYPES.map(v => ({ value: v, label: v }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#94a3b8] font-semibold">Description</label>
            <textarea rows={3} value={oppForm.description} onChange={set('description')}
              placeholder="Describe the opportunity..." className="input resize-none" />
          </div>
          <Input label="Required Skills (comma separated)" placeholder="React, Node.js, DSA"
            value={oppForm.requiredSkills} onChange={set('requiredSkills')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Deadline *" type="date" value={oppForm.deadline} onChange={set('deadline')} />
            <Input label="Min CGPA"   type="number" step="0.1" min="0" max="10"
              value={oppForm.minCGPA} onChange={set('minCGPA')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stipend"   placeholder="₹15,000/month" value={oppForm.stipend}  onChange={set('stipend')} />
            <Input label="Location"  placeholder="Remote"         value={oppForm.location} onChange={set('location')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration"  placeholder="3 months"      value={oppForm.duration} onChange={set('duration')} />
            <Input label="Apply URL" placeholder="https://..."   value={oppForm.applyUrl} onChange={set('applyUrl')} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost"   onClick={() => { setModal(false); setOppForm(BLANK_OPP); }} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={postOpportunity} loading={saving} className="flex-1">Post Opportunity</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
