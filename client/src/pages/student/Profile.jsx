import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { Avatar, Button, Input, Select, Badge, ProgressBar } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, achievementsAPI } from '../../services/api';
import { levelFromXP, xpProgress } from '../../utils';
import toast from 'react-hot-toast';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://10.38.159.20:5000/api').replace(/\/api$/, '');
const LEETCODE_LOGO_URL = 'https://leetcode.com/static/images/LeetCode_Sharing.png';

const emptyCert = {
  title: '',
  provider: '',
  credentialId: '',
  credentialUrl: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
  certificate: null,
};

const emptyShowcase = {
  title: '',
  category: 'cad',
  platform: '',
  url: '',
  description: '',
  file: null,
};

const certFileUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const userId = user?._id || user?.id;
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [githubImporting, setGithubImporting] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('leetcode');
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState({
    name: user?.name || '', bio: user?.bio || '', phone: user?.phone || '',
    aspiration: user?.aspiration || 'Not decided', cgpa: user?.cgpa || '',
    'socialLinks.github': user?.socialLinks?.github || '',
    'socialLinks.linkedin': user?.socialLinks?.linkedin || '',
    'socialLinks.leetcode': user?.socialLinks?.leetcode || '',
    'socialLinks.codeforces': user?.socialLinks?.codeforces || '',
    'platformProfiles.leetcode': user?.platformProfiles?.leetcode || '',
    'platformProfiles.github': user?.platformProfiles?.github || '',
  });
  const [certForm, setCertForm] = useState(emptyCert);
  const [showcaseForm, setShowcaseForm] = useState(emptyShowcase);

  useEffect(() => {
    achievementsAPI.getMine().then(r => setAchievements(r.data.data)).catch(() => {});
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setCert = k => e => setCertForm(p => ({ ...p, [k]: e.target.value }));
  const setShowcase = k => e => setShowcaseForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name, bio: form.bio, phone: form.phone,
        aspiration: form.aspiration, cgpa: Number(form.cgpa),
        socialLinks: {
          github: form['socialLinks.github'],
          linkedin: form['socialLinks.linkedin'],
          leetcode: form['socialLinks.leetcode'],
          codeforces: form['socialLinks.codeforces'],
        },
        platformProfiles: {
          leetcode: form['platformProfiles.leetcode'],
          github: form['platformProfiles.github'],
        },
      };
      const res = await usersAPI.update(userId, payload);
      updateUser(res.data.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const importGitHub = async () => {
    const username = form['platformProfiles.github'];
    if (!username.trim()) {
      toast.error('Enter your GitHub username first');
      return;
    }

    setGithubImporting(true);
    try {
      const res = await usersAPI.importGitHub(userId, username);
      updateUser(res.data.data);
      const stats = res.data.imported;
      setForm(p => ({
        ...p,
        'platformProfiles.github': stats.username,
        'socialLinks.github': stats.profileUrl,
      }));
      toast.success(`Imported ${stats.publicRepos} public GitHub repos`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not import GitHub stats');
    } finally {
      setGithubImporting(false);
    }
  };

  const importLeetCode = async () => {
    if (selectedPlatform !== 'leetcode') {
      toast.error('Only LeetCode import is available right now');
      return;
    }

    const username = form['platformProfiles.leetcode'];
    if (!username.trim()) {
      toast.error('Enter your LeetCode username first');
      return;
    }

    setImporting(true);
    try {
      const res = await usersAPI.importLeetCode(userId, username);
      updateUser(res.data.data);
      const stats = res.data.imported;
      setForm(p => ({
        ...p,
        'platformProfiles.leetcode': stats.username,
        'socialLinks.leetcode': `https://leetcode.com/${stats.username}`,
      }));
      toast.success(`Imported ${stats.leetcodeSolved} solved problems from LeetCode`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not import LeetCode stats');
    } finally {
      setImporting(false);
    }
  };

  const addCertification = async () => {
    if (!certForm.title.trim() || !certForm.provider.trim()) {
      toast.error('Certificate title and provider are required');
      return;
    }

    const data = new FormData();
    Object.entries(certForm).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    setCertLoading(true);
    try {
      const res = await usersAPI.addCertification(userId, data);
      updateUser(res.data.data);
      setCertForm(emptyCert);
      toast.success('Certification added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add certification');
    } finally {
      setCertLoading(false);
    }
  };

  const removeCertification = async (certificationId) => {
    setCertLoading(true);
    try {
      const res = await usersAPI.deleteCertification(userId, certificationId);
      updateUser(res.data.data);
      toast.success('Certification removed');
    } catch {
      toast.error('Failed to remove certification');
    } finally {
      setCertLoading(false);
    }
  };

  const addShowcase = async () => {
    if (!showcaseForm.title.trim()) {
      toast.error('Showcase title is required');
      return;
    }

    const data = new FormData();
    Object.entries(showcaseForm).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    setShowcaseLoading(true);
    try {
      const res = await usersAPI.addShowcaseItem(userId, data);
      updateUser(res.data.data);
      setShowcaseForm(emptyShowcase);
      toast.success('Showcase item added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add showcase item');
    } finally {
      setShowcaseLoading(false);
    }
  };

  const removeShowcase = async (showcaseId) => {
    setShowcaseLoading(true);
    try {
      const res = await usersAPI.deleteShowcaseItem(userId, showcaseId);
      updateUser(res.data.data);
      toast.success('Showcase item removed');
    } catch {
      toast.error('Failed to remove showcase item');
    } finally {
      setShowcaseLoading(false);
    }
  };

  const xp    = user?.xpPoints || 0;
  const level = levelFromXP(xp);
  const prog  = xpProgress(xp);
  const certifications = user?.certifications || [];
  const showcaseItems = user?.showcaseItems || [];
  const leetcodeStats = user?.codingStats || {};
  const githubStats = user?.codingStats || {};
  const leetcodeUsername = user?.platformProfiles?.leetcode || form['platformProfiles.leetcode'];
  const githubUsername = user?.platformProfiles?.github || form['platformProfiles.github'];
  const leetcodeLastUpdated = leetcodeStats.lastUpdated
    ? new Date(leetcodeStats.lastUpdated).toLocaleDateString()
    : 'Not imported yet';

  return (
    <Layout title="My Profile">
      <div className="max-w-5xl mx-auto">
        <div className="card mb-5 bg-[#10192f] border-[#1e293b]">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar name={user?.name} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">{user?.name}</h2>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="indigo">{user?.department}</Badge>
                    <Badge variant="cyan">Sem {user?.semester}</Badge>
                    {user?.rollNumber && <Badge variant="amber">{user.rollNumber}</Badge>}
                    <Badge variant="purple">{user?.aspiration}</Badge>
                  </div>
                  {user?.bio && <p className="text-sm text-[#64748b] mt-2 max-w-lg leading-relaxed">{user.bio}</p>}
                </div>
                <Button variant={editing ? 'ghost' : 'primary'} onClick={() => setEditing(e => !e)}>
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#64748b] mb-1.5">
                  <span>Level {level} - {xp.toLocaleString()} XP</span>
                  <span className="font-mono">{prog}% to next level</span>
                </div>
                <ProgressBar pct={prog} color="#4f46e5" height={6} />
              </div>

              <div className="flex gap-4 mt-4 flex-wrap">
                {[
                  [user?.cgpa, 'CGPA'],
                  [user?.codingStats?.leetcodeSolved, 'LC solved'],
                  [user?.codingStats?.githubRepos || 0, 'GitHub repos'],
                  [certifications.length, 'Certificates'],
                  [showcaseItems.length, 'Showcase'],
                ].map(([val, label], i) => (
                  <div key={i} className="bg-[#081225] border border-[#1e293b] px-3 py-2 text-center min-w-[86px]">
                    <div className="text-sm font-bold font-mono text-white">{val || 0}</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <div className="card">
              <div className="section-title mb-4">{editing ? 'Edit info' : 'Personal info'}</div>
              {editing ? (
                <div className="flex flex-col gap-3">
                  <Input label="Full Name" value={form.name} onChange={set('name')} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8] font-semibold">Bio</label>
                    <textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Tell us about yourself..." className="input resize-none" />
                  </div>
                  <Input label="Phone" value={form.phone} onChange={set('phone')} />
                  <Input label="CGPA" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} />
                  <Select label="Aspiration" value={form.aspiration} onChange={set('aspiration')}
                    options={['Placements','GATE','Higher Studies','Startup','Research','Government','Freelancing','Not decided'].map(v=>({value:v,label:v}))} />
                  <div className="section-title mt-2 mb-2">Social links</div>
                  <Input label="GitHub" placeholder="https://github.com/..." value={form['socialLinks.github']} onChange={set('socialLinks.github')} />
                  <Input label="LinkedIn" placeholder="https://linkedin.com/in/..." value={form['socialLinks.linkedin']} onChange={set('socialLinks.linkedin')} />
                  <Input label="LeetCode" placeholder="https://leetcode.com/..." value={form['socialLinks.leetcode']} onChange={set('socialLinks.leetcode')} />
                  <Input label="Codeforces" placeholder="https://codeforces.com/profile/..." value={form['socialLinks.codeforces']} onChange={set('socialLinks.codeforces')} />
                  <Button variant="primary" onClick={save} loading={loading} className="mt-2">Save Changes</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[['Email', user?.email], ['Department', user?.department], ['Semester', user?.semester], ['Roll No.', user?.rollNumber], ['College', user?.college]].map(([l,v]) => v && (
                    <div key={l} className="flex justify-between gap-4 py-2 border-b border-[#1e2d4a] last:border-0">
                      <span className="text-xs text-[#64748b]">{l}</span>
                      <span className="text-xs font-semibold text-right">{v}</span>
                    </div>
                  ))}
                  <div className="mt-2 space-y-2">
                    {Object.entries(user?.socialLinks || {}).filter(([,v]) => v).map(([k,v]) => (
                      <a key={k} href={v} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-[#64748b] hover:text-indigo-2 transition-colors">
                        <span className="capitalize text-[#64748b] w-16 flex-shrink-0">{k}</span>
                        <span className="truncate">{v}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title mb-4">Coding profile import</div>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
                <Select
                  label="Platform"
                  value={selectedPlatform}
                  onChange={e => setSelectedPlatform(e.target.value)}
                  options={[{ value: 'leetcode', label: 'LeetCode' }]}
                />
                <Input
                  label="Username"
                  placeholder="your-leetcode-username"
                  value={form['platformProfiles.leetcode']}
                  onChange={set('platformProfiles.leetcode')}
                />
              </div>
              <div className="flex gap-3 flex-wrap mt-4">
                <Button variant="cyan" onClick={importLeetCode} loading={importing}>Import Stats</Button>
                <Button variant="ghost" onClick={save} loading={loading}>Save Username</Button>
              </div>
              <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                Enter your LeetCode username to fetch solved count, difficulty split, contest count, and update your profile stats.
              </p>
            </div>

            <div className="card">
              <div className="section-title mb-4">GitHub profile import</div>
              <Input
                label="GitHub username"
                placeholder="your-github-username"
                value={form['platformProfiles.github']}
                onChange={set('platformProfiles.github')}
              />
              <div className="flex gap-3 flex-wrap mt-4">
                <Button variant="cyan" onClick={importGitHub} loading={githubImporting}>Import GitHub Stats</Button>
                <Button variant="ghost" onClick={save} loading={loading}>Save Username</Button>
              </div>
              <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                Imports public repositories and links your GitHub profile. Stars and language details can be expanded later.
              </p>
            </div>

            <div className="card">
              <div className="section-title mb-4">Add design or work showcase</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Title" value={showcaseForm.title} onChange={setShowcase('title')} placeholder="AutoCAD gearbox model" />
                <Select
                  label="Category"
                  value={showcaseForm.category}
                  onChange={setShowcase('category')}
                  options={[
                    { value: 'cad', label: 'CAD / AutoCAD' },
                    { value: 'design', label: 'Design' },
                    { value: 'coding', label: 'Coding' },
                    { value: 'research', label: 'Research' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <Input label="Platform" value={showcaseForm.platform} onChange={setShowcase('platform')} placeholder="AutoCAD, Fusion 360, GitHub..." />
                <Input label="Link" value={showcaseForm.url} onChange={setShowcase('url')} placeholder="Portfolio, Drive, GitHub..." />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-xs text-[#94a3b8] font-semibold">Upload file</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.step,.stp,.iges,.igs"
                  className="input"
                  onChange={e => setShowcaseForm(p => ({ ...p, file: e.target.files?.[0] || null }))}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-xs text-[#94a3b8] font-semibold">Description</label>
                <textarea rows={3} value={showcaseForm.description} onChange={setShowcase('description')} className="input resize-none" />
              </div>
              <Button variant="primary" onClick={addShowcase} loading={showcaseLoading} className="w-full mt-4">Add Showcase Item</Button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-[#081225] border border-[#1e293b] overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={LEETCODE_LOGO_URL}
                      alt="LeetCode"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white">LeetCode Stats</div>
                    <div className="text-xs text-[#64748b] truncate">
                      {leetcodeUsername ? `@${leetcodeUsername}` : 'Import your username to show progress'}
                    </div>
                  </div>
                </div>
                <Badge variant="amber">Live Import</Badge>
              </div>

              <div className="bg-[#081225] border border-[#1e293b] p-5 mb-4">
                <div className="text-[11px] uppercase tracking-wide text-[#64748b] font-semibold">Problems solved</div>
                <div className="text-4xl font-bold font-mono text-white mt-2">
                  {leetcodeStats.leetcodeSolved || 0}
                </div>
                <div className="text-xs text-[#64748b] mt-2">Last updated: {leetcodeLastUpdated}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Easy', leetcodeStats.leetcodeEasy || 0, 'text-[#22c55e]'],
                  ['Medium', leetcodeStats.leetcodeMedium || 0, 'text-[#f59e0b]'],
                  ['Hard', leetcodeStats.leetcodeHard || 0, 'text-[#ef4444]'],
                ].map(([label, value, color]) => (
                  <div key={label} className="bg-[#0b1630] border border-[#1e293b] p-3 text-center">
                    <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
                    <div className="text-[10px] text-[#64748b] mt-1">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 bg-[#0b1630] border border-[#1e293b] p-3 flex items-center justify-between gap-4">
                <span className="text-xs text-[#64748b]">Contests participated</span>
                <span className="text-sm font-bold font-mono text-white">{leetcodeStats.contestsParticipated || 0}</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white text-[#111827] flex items-center justify-center font-black text-sm flex-shrink-0">
                    GH
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white">GitHub Stats</div>
                    <div className="text-xs text-[#64748b] truncate">
                      {githubUsername ? `@${githubUsername}` : 'Import your GitHub username'}
                    </div>
                  </div>
                </div>
                <Badge variant="green">Public</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#081225] border border-[#1e293b] p-4">
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide">Public repos</div>
                  <div className="text-2xl font-bold font-mono text-white mt-2">{githubStats.githubRepos || 0}</div>
                </div>
                <div className="bg-[#081225] border border-[#1e293b] p-4">
                  <div className="text-[10px] text-[#64748b] uppercase tracking-wide">Profile</div>
                  {user?.socialLinks?.github ? (
                    <a href={user.socialLinks.github} target="_blank" rel="noreferrer" className="text-sm text-[#93c5fd] hover:underline mt-3 block truncate">
                      View GitHub
                    </a>
                  ) : (
                    <div className="text-sm text-[#64748b] mt-3">Not linked</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title mb-4">Work showcase ({showcaseItems.length})</div>
              {showcaseItems.length === 0 ? (
                <p className="text-sm text-[#475569] text-center py-4">Add CAD models, design files, research work, or portfolio links here.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {showcaseItems.map(item => (
                    <div key={item._id} className="bg-[#0b1630] border border-[#1e293b] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">{item.title}</div>
                          <div className="text-xs text-[#94a3b8] mt-1 capitalize">
                            {item.category}{item.platform ? ` - ${item.platform}` : ''}
                          </div>
                          {item.description && <div className="text-[11px] text-[#64748b] mt-2 leading-relaxed">{item.description}</div>}
                        </div>
                        <button
                          className="text-xs text-rose hover:underline"
                          disabled={showcaseLoading}
                          onClick={() => removeShowcase(item._id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3 text-xs flex-wrap">
                        {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-[#93c5fd] hover:underline">Open link</a>}
                        {item.fileUrl && <a href={certFileUrl(item.fileUrl)} target="_blank" rel="noreferrer" className="text-[#93c5fd] hover:underline">Uploaded file</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title mb-4">Add certification</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Certificate title" value={certForm.title} onChange={setCert('title')} placeholder="NPTEL Java Programming" />
                <Input label="Provider" value={certForm.provider} onChange={setCert('provider')} placeholder="NPTEL, Coursera..." />
                <Input label="Credential ID" value={certForm.credentialId} onChange={setCert('credentialId')} />
                <Input label="Credential URL" value={certForm.credentialUrl} onChange={setCert('credentialUrl')} />
                <Input label="Issued date" type="date" value={certForm.issuedAt} onChange={setCert('issuedAt')} />
                <Input label="Expiry date" type="date" value={certForm.expiresAt} onChange={setCert('expiresAt')} />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-xs text-[#94a3b8] font-semibold">Upload proof</label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="input"
                  onChange={e => setCertForm(p => ({ ...p, certificate: e.target.files?.[0] || null }))}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-xs text-[#94a3b8] font-semibold">Notes</label>
                <textarea rows={2} value={certForm.notes} onChange={setCert('notes')} className="input resize-none" />
              </div>
              <Button variant="primary" onClick={addCertification} loading={certLoading} className="w-full mt-4">Add Certification</Button>
            </div>

            <div className="card">
              <div className="section-title mb-4">Certifications ({certifications.length})</div>
              {certifications.length === 0 ? (
                <p className="text-sm text-[#475569] text-center py-4">Add NPTEL, Coursera, HackerRank, or other verified learning proof here.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {certifications.map(cert => (
                    <div key={cert._id} className="bg-[#0b1630] border border-[#1e293b] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">{cert.title}</div>
                          <div className="text-xs text-[#94a3b8] mt-1">{cert.provider}</div>
                          {cert.credentialId && <div className="text-[11px] text-[#64748b] mt-1">ID: {cert.credentialId}</div>}
                        </div>
                        <button
                          className="text-xs text-rose hover:underline"
                          disabled={certLoading}
                          onClick={() => removeCertification(cert._id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3 text-xs flex-wrap">
                        {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-[#93c5fd] hover:underline">Credential</a>}
                        {cert.fileUrl && <a href={certFileUrl(cert.fileUrl)} target="_blank" rel="noreferrer" className="text-[#93c5fd] hover:underline">Uploaded proof</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title mb-4">Achievements ({achievements.length})</div>
              {achievements.length === 0 ? (
                <p className="text-sm text-[#475569] text-center py-4">Complete goals to earn badges!</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {achievements.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#0b1630] p-3">
                      <span className="text-xs font-mono text-[#64748b] w-8">#{i + 1}</span>
                      <div>
                        <div className="text-xs font-bold">{a.achievement?.title}</div>
                        <div className="text-[11px] text-[#64748b]">{a.achievement?.description}</div>
                      </div>
                      <Badge variant="amber" className="ml-auto text-[10px]">+{a.achievement?.xpReward} XP</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
