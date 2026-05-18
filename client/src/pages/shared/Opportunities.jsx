import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { Badge, Button, Spinner, EmptyState, Tabs } from '../../components/ui';
import { opportunitiesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../utils';
import toast from 'react-hot-toast';

const TYPE_COLOR = {
  Internship: 'indigo', Hackathon: 'cyan', Research: 'purple',
  Competition: 'amber', Workshop: 'green', Scholarship: 'pink', Job: 'green',
};

export default function Opportunities() {
  const { isStaff } = useAuth();
  const [opps,    setOpps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [type,    setType]    = useState('all');
  const [applied, setApplied] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    opportunitiesAPI
      .getAll({ type: type === 'all' ? undefined : type })
      .then(r => setOpps(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  const apply = async (id) => {
    try {
      await opportunitiesAPI.apply(id);
      setApplied(prev => new Set([...prev, id]));
      toast.success('Application submitted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply');
    }
  };

  return (
    <Layout title="Opportunities">
      <p className="page-intro">
        Internships, hackathons, and workshops posted for students. Filter by type below.
      </p>

      <div className="mb-5">
        <Tabs
          tabs={[
            { value: 'all',         label: 'All' },
            { value: 'Internship',  label: 'Internships' },
            { value: 'Hackathon',   label: 'Hackathons' },
            { value: 'Research',    label: 'Research' },
            { value: 'Competition', label: 'Competitions' },
            { value: 'Workshop',    label: 'Workshops' },
          ]}
          active={type}
          onChange={setType}
        />
      </div>

      {loading
        ? <div className="flex justify-center mt-16"><Spinner size={32} /></div>
        : opps.length === 0
          ? <EmptyState title="No opportunities posted yet" desc="Check back later or ask faculty to post one." />
          : (
            <div className="flex flex-col gap-3">
              {opps.map((o) => (
                <div key={o._id} className="card hover:border-[#334155] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#081225] border border-[#1e293b] flex items-center justify-center text-xs font-bold text-[#93c5fd] flex-shrink-0">
                      {o.type?.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <div className="font-semibold text-[15px] text-white">{o.title}</div>
                          <div className="text-xs text-[#64748b] mt-0.5">
                            {o.company} · Due {fmtDate(o.deadline)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {o.matchScore !== undefined && (
                            <Badge variant="green" className="text-xs">{o.matchScore}% match</Badge>
                          )}
                          <Badge variant={TYPE_COLOR[o.type] || 'indigo'} className="text-xs">{o.type}</Badge>
                        </div>
                      </div>

                      {o.description && (
                        <p className="text-xs text-[#94a3b8] mb-3 line-clamp-2 leading-relaxed">{o.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {o.requiredSkills?.map((s, j) => (
                          <span key={j} className="text-[10px] bg-[#081225] border border-[#1e293b] text-[#64748b] px-2 py-0.5 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-[#64748b]">
                        {o.stipend && <span className="text-[#93c5fd]">{o.stipend}</span>}
                        {o.location && <span>{o.location}</span>}
                        {o.duration && <span>{o.duration}</span>}
                        <div className="ml-auto flex gap-2">
                          {!isStaff && (
                            applied.has(o._id)
                              ? <Button variant="success" className="text-xs py-1.5 px-3" disabled>Applied</Button>
                              : <Button variant="primary" className="text-xs py-1.5 px-3" onClick={() => apply(o._id)}>Apply</Button>
                          )}
                          {isStaff && (
                            <Button variant="ghost" className="text-xs py-1.5 px-3">Applicants</Button>
                          )}
                          {o.applyUrl && (
                            <a href={o.applyUrl} target="_blank" rel="noreferrer">
                              <Button variant="ghost" className="text-xs py-1.5 px-3">Official page</Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </Layout>
  );
}
