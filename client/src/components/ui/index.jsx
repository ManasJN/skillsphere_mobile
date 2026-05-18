import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '../../utils';

export const Avatar = ({ name = '', size = 36, className = '', src }) => {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className={`object-cover ${className}`} />;
  return (
    <motion.div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`bg-[#253552] flex items-center justify-center font-semibold text-[#e2e8f0] flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </motion.div>
  );
};

const badgeVariants = {
  indigo: 'bg-[#4f46e5]/15 text-[#93c5fd] border border-[#4f46e5]/30',
  cyan:   'bg-cyan/10   text-cyan    border border-cyan/25',
  green:  'bg-emerald/10 text-emerald border border-emerald/25',
  amber:  'bg-amber/10  text-amber   border border-amber/25',
  red:    'bg-rose/10   text-rose    border border-rose/25',
  purple: 'bg-purple/10 text-purple  border border-purple/25',
  pink:   'bg-pink/10   text-pink    border border-pink/25',
};
export const Badge = ({ children, variant = 'indigo', className = '' }) => (
  <span className={`badge ${badgeVariants[variant] || badgeVariants.indigo} ${className}`}>{children}</span>
);

export const ProgressBar = ({ pct = 0, color = '#4f46e5', height = 6, animate = true }) => (
  <div className="progress-bar" style={{ height }}>
    <motion.div
      className="progress-fill"
      style={{ background: color }}
      initial={animate ? { width: 0 } : { width: `${pct}%` }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  </div>
);

export const Spinner = ({ size = 20, className = '' }) => (
  <motion.div
    style={{ width: size, height: size, borderWidth: size * 0.1 }}
    className={`border-[#1e293b] border-t-[#4f46e5] animate-spin ${className}`}
  />
);

export const Button = ({ children, variant = 'primary', loading, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-150 cursor-pointer px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#4f46e5] text-white hover:bg-[#4338ca] border-0',
    ghost:   'bg-transparent text-[#94a3b8] border border-[#253552] hover:bg-[#0b1630] hover:text-[#f8fafc]',
    cyan:    'bg-[#06b6d4] text-white hover:opacity-90 border-0',
    danger:  'bg-rose/10 text-rose border border-rose/25 hover:bg-rose/20',
    success: 'bg-emerald/10 text-emerald border border-emerald/25 hover:bg-emerald/20',
  };
  return (
    <button disabled={loading} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs text-[#94a3b8] font-semibold">{label}</label>}
    <input className="input" {...props} />
    {error && <p className="text-xs text-rose">{error}</p>}
  </div>
);

export const Select = ({ label, options = [], className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs text-[#94a3b8] font-semibold">{label}</label>}
    <select className="input" {...props}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

export const Modal = ({ open, onClose, title, children, width = 'max-w-lg' }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div
          className={`relative w-full ${width} bg-[#10192f] border border-[#1e293b] p-6`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          {title && (
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="font-semibold text-base text-white">{title}</h3>
              <button onClick={onClose} className="text-[#64748b] hover:text-white text-lg leading-none">×</button>
            </div>
          )}
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const EmptyState = ({ title, desc, action }) => (
  <div className="flex flex-col items-start justify-center py-14 px-2">
    <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">Nothing here yet</div>
    <div className="font-semibold text-[#f8fafc] mb-1">{title}</div>
    {desc && <p className="text-sm text-[#94a3b8] mb-4 max-w-sm leading-relaxed">{desc}</p>}
    {action}
  </div>
);

export const StatCard = ({ label, value, change, className = '' }) => (
  <div className={`stat-card ${className}`}>
    <span className="text-[10px] text-[#64748b] uppercase tracking-wide font-semibold">{label}</span>
    <div className="text-2xl font-bold font-mono text-white mt-2">{value}</div>
    {change !== undefined && (
      <div className={`text-[11px] mt-2 ${change >= 0 ? 'text-[#93c5fd]' : 'text-rose'}`}>
        {change >= 0 ? '+' : ''}{change}% vs last semester
      </div>
    )}
  </div>
);

export const Tabs = ({ tabs = [], active, onChange }) => (
  <div className="flex gap-0 border border-[#1e293b] bg-[#081225] p-0.5">
    {tabs.map(t => (
      <button
        key={t.value}
        onClick={() => onChange(t.value)}
        className={`px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
          active === t.value
            ? 'bg-[#4f46e5] text-white'
            : 'text-[#64748b] hover:text-[#94a3b8]'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);
