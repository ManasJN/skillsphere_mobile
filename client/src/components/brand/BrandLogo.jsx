import React from 'react';

export default function BrandLogo({ compact = false, size = 'md', subtitle, className = '' }) {
  const sizes = {
    sm: { mark: 'w-8 h-8', title: 'text-base', sub: 'text-[10px]' },
    md: { mark: 'w-10 h-10', title: 'text-xl', sub: 'text-[11px]' },
    lg: { mark: 'w-12 h-12', title: 'text-3xl', sub: 'text-sm' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.mark} relative flex items-center justify-center bg-[#4f46e5] border border-[#7dd3fc]/30 shadow-[0_0_24px_rgba(79,70,229,0.35)]`}>
        <div className="absolute inset-1 border border-white/20" />
        <span className="font-bold text-white tracking-tight">SS</span>
      </div>
      {!compact && (
        <div>
          <div className={`${s.title} font-extrabold tracking-tight text-white leading-none`}>SkillSphere</div>
          {subtitle && <div className={`${s.sub} text-[#64748b] mt-1`}>{subtitle}</div>}
        </div>
      )}
    </div>
  );
}
