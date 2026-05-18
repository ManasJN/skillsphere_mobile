import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../../components/layout';
import { Button, Badge, Modal, Input, Select, Spinner, EmptyState, Tabs } from '../../components/ui';
import { useProjects } from '../../hooks';
import { statusColor, fmtDate } from '../../utils';
import toast from 'react-hot-toast';

const DOMAINS = ['Web','Mobile','AI/ML','IoT','Game','CLI','API','Research','Other'];
const STATUSES = ['planned','ongoing','completed','abandoned'];

function ProjectModal({ open, onClose, onSave, initial }) {
  const blank = { title:'', description:'', domain:'Web', status:'planned', techStack:'', githubUrl:'', liveUrl:'', startDate:'' };
  const [form, setForm] = useState(initial ? { ...initial, techStack: initial.techStack?.join(', ') || '' } : blank);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.title) return toast.error('Project title is required');
    setLoading(true);
    try {
      await onSave({ ...form, techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean) });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Project' : 'Add Project'} width="max-w-xl">
      <div className="flex flex-col gap-4">
        <Input label="Project Title *" placeholder="My Awesome Project" value={form.title} onChange={set('title')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#94a3b8] font-semibold">Description</label>
          <textarea rows={3} value={form.description} onChange={set('description')}
            placeholder="What does this project do?"
            className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Domain" value={form.domain} onChange={set('domain')} options={DOMAINS.map(v=>({value:v,label:v}))} />
          <Select label="Status" value={form.status} onChange={set('status')} options={STATUSES.map(v=>({value:v,label:v}))} />
        </div>
        <Input label="Tech Stack (comma separated)" placeholder="React, Node.js, MongoDB" value={form.techStack} onChange={set('techStack')} />
        <Input label="GitHub URL" placeholder="https://github.com/..." value={form.githubUrl} onChange={set('githubUrl')} />
        <Input label="Live Demo URL" placeholder="https://myproject.vercel.app" value={form.liveUrl} onChange={set('liveUrl')} />
        <Input label="Start Date" type="date" value={form.startDate?.slice(0,10) || ''} onChange={set('startDate')} />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={save} loading={loading} className="flex-1">Save Project</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Projects() {
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects();
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter]   = useState('all');

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const saveProject = async (data) => {
    if (editing) await updateProject(editing._id, data); else await addProject(data);
    setEditing(null);
  };

  return (
    <Layout title="Projects">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <Tabs
          tabs={[{value:'all',label:'All'},{value:'ongoing',label:'Ongoing'},{value:'completed',label:'Done'},{value:'planned',label:'Planned'}]}
          active={filter} onChange={setFilter}
        />
        <Button variant="primary" onClick={() => { setEditing(null); setModal(true); }}>+ Add Project</Button>
      </div>

      {loading ? <Spinner className="mx-auto mt-16" size={32} /> :
       filtered.length === 0 ? <EmptyState title="No projects here" desc="Add projects you have built or are working on" action={<Button variant="primary" onClick={() => setModal(true)}>Add project</Button>} /> :
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
         {filtered.map((p, i) => (
           <motion.div key={p._id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
             className="card group hover:-translate-y-1 hover:shadow-glow transition-all duration-200 flex flex-col">
             {/* Header */}
             <div className="flex items-start justify-between mb-3">
               <div className="flex-1 min-w-0">
                 <div className="font-bold text-sm truncate">{p.title}</div>
                 <Badge variant="indigo" className="text-[10px] mt-1">{p.domain}</Badge>
               </div>
               <Badge variant={statusColor(p.status)} className="text-[10px] ml-2 flex-shrink-0">{p.status}</Badge>
             </div>

             {p.description && <p className="text-xs text-[#64748b] mb-3 line-clamp-2 leading-relaxed">{p.description}</p>}

             {/* Tech stack */}
             <div className="flex flex-wrap gap-1 mb-3">
               {p.techStack?.slice(0,4).map((t,j) => (
                 <span key={j} className="text-[10px] font-mono bg-[#0b1630] border border-[#1e2d4a] px-2 py-0.5 rounded text-[#64748b]">{t}</span>
               ))}
               {p.techStack?.length > 4 && <span className="text-[10px] text-[#475569]">+{p.techStack.length-4}</span>}
             </div>

             <div className="mt-auto">
               {/* Links */}
               <div className="flex gap-2 mb-3">
                 {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer"
                   className="text-xs text-[#64748b] hover:text-[#93c5fd] transition-colors">GitHub</a>}
                 {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer"
                   className="text-xs text-[#64748b] hover:text-[#93c5fd] transition-colors ml-3">Demo</a>}
               </div>
               {/* Actions */}
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" className="flex-1 text-xs py-1" onClick={() => { setEditing(p); setModal(true); }}>Edit</Button>
                 {p.status !== 'completed' &&
                   <Button variant="success" className="flex-1 text-xs py-1" onClick={() => updateProject(p._id, { status:'completed' })}>Mark done</Button>}
                 <Button variant="danger" className="flex-1 text-xs py-1" onClick={() => deleteProject(p._id)}>×</Button>
               </div>
             </div>
           </motion.div>
         ))}
       </div>
      }

      <ProjectModal open={modal} onClose={() => { setModal(false); setEditing(null); }} onSave={saveProject} initial={editing} />
    </Layout>
  );
}
