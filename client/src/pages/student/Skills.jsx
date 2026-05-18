import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../../components/layout';
import { Button, Badge, ProgressBar, Modal, Input, Select, Spinner, EmptyState, Tabs } from '../../components/ui';
import { useSkills, useGoals } from '../../hooks';
import { fmtDate, priorityColor } from '../../utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['DSA','Web Development','AI/ML','Cloud','UI/UX','App Development','DevOps','Cybersecurity','Database','Language','Framework','Other'];
const SKILL_COLORS = { DSA:'#4f46e5','Web Development':'#06b6d4','AI/ML':'#8b5cf6',Cloud:'#10b981','UI/UX':'#ec4899','App Development':'#f59e0b',Default:'#94a3b8' };
const getColor = c => SKILL_COLORS[c] || SKILL_COLORS.Default;

// ── Skill Modal ───────────────────────────────────────────────────────────────
function SkillModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name:'', category:'DSA', level:50, targetDate:'' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) return toast.error('Skill name is required');
    setLoading(true);
    try { await onSave(form); onClose(); } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Skill' : 'Add New Skill'}>
      <div className="flex flex-col gap-4">
        <Input label="Skill Name *" placeholder="e.g. React.js" value={form.name} onChange={set('name')} />
        <Select label="Category" value={form.category} onChange={set('category')} options={CATEGORIES.map(v=>({value:v,label:v}))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#94a3b8] font-semibold">Proficiency Level: {form.level}%</label>
          <input type="range" min={0} max={100} value={form.level} onChange={set('level')} className="w-full accent-indigo cursor-pointer" />
          <div className="flex justify-between text-[10px] text-[#475569]"><span>Beginner</span><span>Intermediate</span><span>Expert</span></div>
        </div>
        <Input label="Target Completion" type="date" value={form.targetDate} onChange={set('targetDate')} />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={save} loading={loading} className="flex-1">Save Skill</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────────────────
function GoalModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { title:'', category:'Coding', type:'semester', priority:'medium', deadline:'', targetValue:'', currentValue:0, unit:'' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.title || !form.deadline) return toast.error('Title and deadline are required');
    setLoading(true);
    try { await onSave(form); onClose(); } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Goal' : 'New Goal'}>
      <div className="flex flex-col gap-4">
        <Input label="Goal Title *" placeholder="e.g. Solve 300 LeetCode problems" value={form.title} onChange={set('title')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={set('category')} options={['Coding','Academic','Project','Skill','Career','Other'].map(v=>({value:v,label:v}))} />
          <Select label="Type" value={form.type} onChange={set('type')} options={['monthly','semester','yearly','custom'].map(v=>({value:v,label:v}))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" value={form.priority} onChange={set('priority')} options={['low','medium','high'].map(v=>({value:v,label:v}))} />
          <Input label="Deadline *" type="date" value={form.deadline} onChange={set('deadline')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Target" placeholder="300" value={form.targetValue} onChange={set('targetValue')} />
          <Input label="Current" placeholder="0" value={form.currentValue} onChange={set('currentValue')} />
          <Input label="Unit" placeholder="problems" value={form.unit} onChange={set('unit')} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={save} loading={loading} className="flex-1">Save Goal</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SkillsGoals() {
  const [tab, setTab] = useState('skills');
  const { skills, loading: sl, addSkill, updateSkill, deleteSkill } = useSkills();
  const { goals, loading: gl, addGoal, updateGoal, deleteGoal } = useGoals();
  const [skillModal, setSkillModal] = useState(false);
  const [goalModal, setGoalModal]   = useState(false);
  const [editSkill, setEditSkill]   = useState(null);
  const [editGoal, setEditGoal]     = useState(null);

  const openEditSkill = sk => { setEditSkill(sk); setSkillModal(true); };
  const openEditGoal  = g  => { setEditGoal(g);   setGoalModal(true);  };

  const saveSkill = async (data) => {
    if (editSkill) await updateSkill(editSkill._id, data); else await addSkill(data);
    setEditSkill(null);
  };
  const saveGoal = async (data) => {
    if (editGoal) await updateGoal(editGoal._id, data); else await addGoal(data);
    setEditGoal(null);
  };

  return (
    <Layout title="Skills & Goals">
      <div className="flex items-center justify-between mb-5">
        <Tabs tabs={[{value:'skills',label:'Skills'},{value:'goals',label:'Goals'}]} active={tab} onChange={setTab} />
        {tab === 'skills'
          ? <Button variant="primary" onClick={() => { setEditSkill(null); setSkillModal(true); }}>+ Add Skill</Button>
          : <Button variant="primary" onClick={() => { setEditGoal(null);  setGoalModal(true);  }}>+ New Goal</Button>
        }
      </div>

      {/* Skills Tab */}
      {tab === 'skills' && (
        sl ? <Spinner className="mx-auto mt-16" size={32} /> :
        skills.length === 0 ? <EmptyState title="No skills added yet" desc="Start tracking your tech skills" action={<Button variant="primary" onClick={() => setSkillModal(true)}>Add skill</Button>} /> :
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {skills.map((sk, i) => (
            <motion.div key={sk._id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
              className="card group hover:-translate-y-1 hover:shadow-glow transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-sm">{sk.name}</div>
                  <Badge variant="indigo" className="text-[10px] mt-1">{sk.category}</Badge>
                </div>
                <div className="text-2xl font-bold font-mono" style={{ color: getColor(sk.category) }}>{sk.level}%</div>
              </div>
              <ProgressBar pct={sk.level} color={getColor(sk.category)} height={8} />
              {sk.targetDate && <div className="text-[11px] text-[#475569] mt-2">Target: {fmtDate(sk.targetDate)}</div>}
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" className="flex-1 text-xs py-1" onClick={() => openEditSkill(sk)}>Edit</Button>
                <Button variant="danger" className="flex-1 text-xs py-1" onClick={() => deleteSkill(sk._id)}>Delete</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {tab === 'goals' && (
        gl ? <Spinner className="mx-auto mt-16" size={32} /> :
        goals.length === 0 ? <EmptyState title="No goals yet" desc="Set goals and track your progress over the semester" action={<Button variant="primary" onClick={() => setGoalModal(true)}>Add goal</Button>} /> :
        <div className="flex flex-col gap-4">
          {goals.map((g, i) => (
            <motion.div key={g._id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
              className="card group hover:shadow-glow transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4">
                  <div className="font-bold text-sm mb-1.5">{g.title}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={priorityColor(g.priority)} className="text-[10px]">{g.priority} priority</Badge>
                    <Badge variant="indigo" className="text-[10px]">{g.type}</Badge>
                    <Badge variant="cyan" className="text-[10px]">{g.category}</Badge>
                    {g.status === 'completed' && <Badge variant="green" className="text-[10px]">completed</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-indigo-2">{g.progress}%</div>
                  {g.targetValue && <div className="text-[11px] text-[#475569]">{g.currentValue}/{g.targetValue} {g.unit}</div>}
                </div>
              </div>
              <ProgressBar pct={g.progress} color={g.priority === 'high' ? '#ef4444' : g.priority === 'medium' ? '#f59e0b' : '#10b981'} height={8} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-[#475569]">Due: {fmtDate(g.deadline)}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" className="text-xs py-1 px-3" onClick={() => openEditGoal(g)}>Edit</Button>
                  <Button variant="success" className="text-xs py-1 px-3"
                    onClick={() => updateGoal(g._id, { progress: Math.min(100, g.progress + 10) })}>+10%</Button>
                  <Button variant="danger" className="text-xs py-1 px-3" onClick={() => deleteGoal(g._id)}>×</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <SkillModal open={skillModal} onClose={() => { setSkillModal(false); setEditSkill(null); }} onSave={saveSkill} initial={editSkill} />
      <GoalModal  open={goalModal}  onClose={() => { setGoalModal(false);  setEditGoal(null);  }} onSave={saveGoal}  initial={editGoal} />
    </Layout>
  );
}
