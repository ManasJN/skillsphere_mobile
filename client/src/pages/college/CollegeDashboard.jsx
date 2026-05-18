import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { Avatar, Badge, Button, EmptyState, Input, Modal, Spinner, StatCard, Select } from '../../components/ui';
import { collegesAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const BLANK_ANNOUNCEMENT = { title: '', body: '', audience: 'verified-students', department: '' };
const BLANK_EVENT = { title: '', description: '', type: 'event', startsAt: '', location: '', link: '' };

export default function CollegeDashboard() {
  const [college, setCollege] = useState(null);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(BLANK_ANNOUNCEMENT);
  const [event, setEvent] = useState(BLANK_EVENT);
  const [collegeDocs, setCollegeDocs] = useState({ logo: null, documents: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const collegeRes = await collegesAPI.me();
      setCollege(collegeRes.data.data);
      if (collegeRes.data.data?.verificationStatus === 'approved') {
        const [requestsRes, studentsRes] = await Promise.all([
          collegesAPI.pendingStudents(),
          usersAPI.getAll({ role: 'student', limit: 50 }),
        ]);
        setRequests(requestsRes.data.data);
        setStudents(studentsRes.data.data.filter((student) => String(student.collegeId?._id || student.collegeId) === String(collegeRes.data.data._id)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load college dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    try {
      await collegesAPI.decideStudent(id, { decision });
      setRequests((prev) => prev.filter((request) => request._id !== id));
      toast.success(decision === 'approved' ? 'Student verified' : 'Request rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Decision failed');
    }
  };

  const postAnnouncement = async () => {
    if (!announcement.title || !announcement.body) return toast.error('Title and message are required');
    setSaving(true);
    try {
      const res = await collegesAPI.createAnnouncement(announcement);
      toast.success(`Announcement posted. Notified ${res.data.notified || 0} students.`);
      setAnnouncement(BLANK_ANNOUNCEMENT);
      setAnnouncementOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post announcement');
    } finally {
      setSaving(false);
    }
  };

  const postEvent = async () => {
    if (!event.title || !event.startsAt) return toast.error('Title and start date are required');
    setSaving(true);
    try {
      await collegesAPI.createEvent(event);
      toast.success('Event published');
      setEvent(BLANK_EVENT);
      setEventOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="College Dashboard"><div className="flex justify-center mt-24"><Spinner size={36} /></div></Layout>;

  if (college?.verificationStatus !== 'approved') {
    const uploadCollegeDocs = async () => {
      if (!collegeDocs.logo && collegeDocs.documents.length === 0) return toast.error('Choose a logo or verification document');
      const formData = new FormData();
      if (collegeDocs.logo) formData.append('logo', collegeDocs.logo);
      collegeDocs.documents.forEach((file) => formData.append('documents', file));
      setSaving(true);
      try {
        const res = await collegesAPI.uploadDocuments(formData);
        setCollege(res.data.data);
        toast.success('Documents uploaded for review');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
      } finally {
        setSaving(false);
      }
    };

    return (
      <Layout title="College Verification">
        <div className="card max-w-3xl">
          <Badge variant="amber">Pending Approval</Badge>
          <h2 className="text-xl font-bold mt-4 mb-2">{college?.collegeName || 'College account'}</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Your organization account has been created and is waiting for platform-owner approval. Once approved, this dashboard will unlock student verification, announcements, events, resources, and notifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <input className="input" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setCollegeDocs((p) => ({ ...p, logo: e.target.files?.[0] || null }))} />
            <input className="input md:col-span-2" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setCollegeDocs((p) => ({ ...p, documents: Array.from(e.target.files || []) }))} />
            <Button loading={saving} onClick={uploadCollegeDocs}>Upload verification files</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const verifiedStudents = students.filter((student) => student.verificationStatus === 'verified');

  return (
    <Layout title="College Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending approvals" value={requests.length} />
        <StatCard label="Verified students" value={verifiedStudents.length} />
        <StatCard label="Total linked students" value={students.length} />
        <StatCard label="Departments" value={new Set(students.map((s) => s.department).filter(Boolean)).size} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="section-title">Pending student verification</span>
            <Badge variant="cyan">{college.collegeName}</Badge>
          </div>
          {requests.length === 0 ? (
            <EmptyState title="No pending requests" desc="New student verification requests will appear here." />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request._id} className="card-sm flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar name={request.student?.name} />
                    <div>
                      <div className="font-semibold text-sm">{request.student?.name}</div>
                      <div className="text-xs text-[#64748b]">{request.student?.email} · {request.submittedProfile?.rollNumber}</div>
                      <div className="text-xs text-[#94a3b8] mt-1">{request.submittedProfile?.department} · Semester {request.submittedProfile?.semester}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a className="btn-ghost text-xs" href={request.idProofUrl} target="_blank" rel="noreferrer">View ID</a>
                    <Button variant="success" className="text-xs" onClick={() => decide(request._id, 'approved')}>Approve</Button>
                    <Button variant="danger" className="text-xs" onClick={() => decide(request._id, 'rejected')}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title mb-4">College actions</div>
          <div className="grid gap-3">
            <Button onClick={() => setAnnouncementOpen(true)}>Post announcement</Button>
            <Button variant="ghost" onClick={() => setEventOpen(true)}>Create event</Button>
            <Button variant="ghost" onClick={() => toast('Resource uploads can reuse this college module next.')}>Upload resource</Button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title mb-4">Student directory</div>
        {students.length === 0 ? <EmptyState title="No linked students yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1e2d4a]">
                  {['Student', 'Dept', 'Sem', 'Roll', 'Status', 'Email'].map((h) => <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-[.7px] text-[#475569]">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id} className="border-b border-[#1e2d4a] last:border-0">
                    <td className="py-3 px-3 font-semibold text-sm">{student.name}</td>
                    <td className="py-3 px-3 text-sm">{student.department}</td>
                    <td className="py-3 px-3 text-sm">{student.semester}</td>
                    <td className="py-3 px-3 text-sm">{student.rollNumber}</td>
                    <td className="py-3 px-3"><Badge variant={student.verificationStatus === 'verified' ? 'green' : 'amber'}>{student.verificationStatus}</Badge></td>
                    <td className="py-3 px-3 text-sm text-[#94a3b8]">{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} title="Post Announcement">
        <div className="flex flex-col gap-3">
          <Input label="Title" value={announcement.title} onChange={(e) => setAnnouncement((p) => ({ ...p, title: e.target.value }))} />
          <textarea className="input resize-none" rows={5} placeholder="Announcement details" value={announcement.body} onChange={(e) => setAnnouncement((p) => ({ ...p, body: e.target.value }))} />
          <Button onClick={postAnnouncement} loading={saving}>Publish</Button>
        </div>
      </Modal>

      <Modal open={eventOpen} onClose={() => setEventOpen(false)} title="Create Event">
        <div className="flex flex-col gap-3">
          <Input label="Title" value={event.title} onChange={(e) => setEvent((p) => ({ ...p, title: e.target.value }))} />
          <Select label="Type" value={event.type} onChange={(e) => setEvent((p) => ({ ...p, type: e.target.value }))} options={['event', 'opportunity', 'workshop', 'placement', 'club'].map((v) => ({ value: v, label: v }))} />
          <Input label="Starts at" type="datetime-local" value={event.startsAt} onChange={(e) => setEvent((p) => ({ ...p, startsAt: e.target.value }))} />
          <Input label="Location" value={event.location} onChange={(e) => setEvent((p) => ({ ...p, location: e.target.value }))} />
          <Input label="Link" value={event.link} onChange={(e) => setEvent((p) => ({ ...p, link: e.target.value }))} />
          <textarea className="input resize-none" rows={4} placeholder="Description" value={event.description} onChange={(e) => setEvent((p) => ({ ...p, description: e.target.value }))} />
          <Button onClick={postEvent} loading={saving}>Publish event</Button>
        </div>
      </Modal>
    </Layout>
  );
}
