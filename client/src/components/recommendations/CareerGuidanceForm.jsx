import React, { useState, useEffect } from 'react';
import { Button, Select } from '../ui';

const DOMAINS = [
  'Web Development', 'Mobile Development', 'AI/ML', 'Data Science',
  'Cloud & DevOps', 'Cybersecurity', 'DSA & Competitive Programming',
  'UI/UX Design', 'Embedded/IoT', 'Not sure yet',
];

const INTEREST_OPTIONS = [
  'Web Development', 'Mobile apps', 'Machine learning', 'Data analysis',
  'Competitive programming', 'UI design', 'Cloud infrastructure', 'Cybersecurity',
  'Open source', 'Startups', 'Research', 'Government exams',
];

const GOAL_OPTIONS = [
  'Campus placements', 'Internship this year', 'Build portfolio',
  'Improve CGPA', 'Learn full-stack', 'Contest rating', 'Freelancing', 'Higher studies',
];

const WEAK_OPTIONS = [
  'JavaScript', 'Python', 'DSA', 'React', 'Node.js', 'SQL',
  'Communication', 'Resume', 'System design', 'Git', 'Time management', 'Aptitude',
];

const TagInput = ({ label, options, selected, onChange, hint }) => {
  const toggle = (item) => {
    if (selected.includes(item)) onChange(selected.filter((s) => s !== item));
    else onChange([...selected, item]);
  };

  return (
    <div>
      <label className="text-xs text-[#94a3b8] font-semibold block mb-2">{label}</label>
      {hint && <p className="text-[11px] text-[#64748b] mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 border transition-colors ${
              selected.includes(opt)
                ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                : 'bg-[#081225] text-[#94a3b8] border-[#1e293b] hover:border-[#334155]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CareerGuidanceForm({ initial, onSubmit, loading }) {
  const [interests, setInterests] = useState([]);
  const [preferredDomain, setPreferredDomain] = useState('Web Development');
  const [learningGoals, setLearningGoals] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [academicFocus, setAcademicFocus] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (!initial) return;
    setInterests(initial.interests || []);
    setPreferredDomain(initial.preferredDomain || 'Web Development');
    setLearningGoals(initial.learningGoals || []);
    setWeakAreas(initial.weakAreas || []);
    setAcademicFocus(initial.academicFocus || '');
    setAdditionalNotes(initial.additionalNotes || '');
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      interests,
      preferredDomain,
      learningGoals,
      weakAreas,
      academicFocus,
      additionalNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card border-[#253552] space-y-5">
      <div>
        <h2 className="section-title">Your career inputs</h2>
        <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">
          We combine this with your skills, goals, projects, and coding stats on SkillSphere.
          Recommendations update when you regenerate after changing your profile.
        </p>
      </div>

      <Select
        label="Preferred domain"
        value={preferredDomain}
        onChange={(e) => setPreferredDomain(e.target.value)}
        options={DOMAINS.map((d) => ({ value: d, label: d }))}
      />

      <TagInput
        label="Interests"
        options={INTEREST_OPTIONS}
        selected={interests}
        onChange={setInterests}
        hint="Pick what you actually enjoy — not everything."
      />

      <TagInput
        label="Learning goals"
        options={GOAL_OPTIONS}
        selected={learningGoals}
        onChange={setLearningGoals}
      />

      <TagInput
        label="Weak areas (be honest)"
        options={WEAK_OPTIONS}
        selected={weakAreas}
        onChange={setWeakAreas}
        hint="Example: Web + HTML/CSS but weak in JavaScript."
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#94a3b8] font-semibold">Academic focus</label>
        <textarea
          rows={2}
          value={academicFocus}
          onChange={(e) => setAcademicFocus(e.target.value)}
          placeholder="e.g. Semester 6, targeting product companies, CGPA target 8.5"
          className="input resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#94a3b8] font-semibold">Anything else</label>
        <textarea
          rows={2}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Optional context — timeline, constraints, preferred stack..."
          className="input resize-none"
        />
      </div>

      <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
        Save and generate recommendations
      </Button>
    </form>
  );
};
