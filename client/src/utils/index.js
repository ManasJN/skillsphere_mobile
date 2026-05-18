import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo    = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
export const fmtDate    = (date, fmt = 'dd MMM yyyy') => format(new Date(date), fmt);
export const fmtNum     = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
export const levelFromXP = (xp) => Math.floor(xp / 500) + 1;
export const xpToNextLevel = (xp) => { const l = levelFromXP(xp); return (l * 500) - xp; };
export const xpProgress = (xp) => { const l = levelFromXP(xp); const base = (l - 1) * 500; return Math.round(((xp - base) / 500) * 100); };

export const priorityColor = (p) => ({ high: 'red', medium: 'amber', low: 'green' }[p] || 'indigo');
export const statusColor   = (s) => ({ completed: 'green', ongoing: 'cyan', planned: 'indigo', abandoned: 'red' }[s] || 'indigo');

export const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const avatarGradient = (name = '') => {
  const gradients = [
    'from-indigo to-purple', 'from-cyan to-indigo', 'from-purple to-pink',
    'from-emerald to-cyan', 'from-amber to-rose', 'from-pink to-purple',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

export const clsx = (...classes) => classes.filter(Boolean).join(' ');
