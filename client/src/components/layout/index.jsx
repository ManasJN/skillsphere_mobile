import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks';
import { Avatar } from '../ui';
import BrandLogo from '../brand/BrandLogo';
import { levelFromXP, xpProgress } from '../../utils';

const studentNav = [
  { section: 'Menu' },
  { to: '/dashboard',     label: 'Dashboard' },
  { to: '/profile',       label: 'My Profile' },
  { to: '/skills',        label: 'Skills & Goals' },
  { to: '/projects',      label: 'Projects' },
  { section: 'Discover' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/opportunities', label: 'Opportunities', badge: 'unread' },
  { to: '/leaderboard',   label: 'Leaderboard' },
  { section: 'Insights' },
  { to: '/analytics',     label: 'Analytics' },
  { to: '/notifications', label: 'Notifications', badge: 'unread' },
  { to: '/settings',      label: 'Settings' },
];
const collegeNav = [
  { section: 'Menu' },
  { to: '/college',       label: 'Dashboard' },
  { to: '/students',      label: 'Student directory' },
  { to: '/leaderboard',   label: 'Leaderboard' },
  { to: '/analytics',     label: 'Analytics' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/notifications', label: 'Notifications', badge: 'unread' },
  { to: '/settings',      label: 'Settings' },
];
const adminNav = [
  { section: 'Internal' },
  { to: '/internal/admin', label: 'Verification' },
  { to: '/leaderboard',   label: 'Leaderboard' },
  { to: '/analytics',     label: 'Analytics' },
  { to: '/opportunities', label: 'Opportunities' },
  { section: 'Admin' },
  { to: '/notifications', label: 'Notifications', badge: 'unread' },
  { to: '/settings',      label: 'Settings' },
];

const navByRole = { student: studentNav, college: collegeNav, admin: adminNav };

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount }  = useNotifications();
  const nav              = navByRole[user?.role] || studentNav;
  const xp               = user?.xpPoints || 0;
  const level            = levelFromXP(xp);
  const prog             = xpProgress(xp);

  return (
    <aside className="w-[210px] min-w-[210px] bg-[#081225] border-r border-[#1e293b] flex flex-col h-full overflow-hidden">
      <motion.div className="px-5 py-4 border-b border-[#1e293b]">
        <BrandLogo size="sm" subtitle="Verified campus network" />
      </motion.div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto flex flex-col gap-0.5">
        {nav.map((item, i) => {
          if (item.section) return (
            <div key={i} className="text-[10px] text-[#64748b] uppercase tracking-wide px-3 pt-3 pb-1">{item.section}</div>
          );
          const badge = item.badge === 'unread' ? unreadCount : null;
          return (
            <NavLink key={i} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="bg-[#4f46e5] text-white text-[10px] px-1.5 py-0.5 font-semibold min-w-[18px] text-center">{badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {user?.role === 'student' && (
        <div className="px-4 pb-3">
          <div className="flex justify-between text-[11px] text-[#64748b] mb-1">
            <span>Level {level}</span>
            <span className="font-mono">{xp} XP</span>
          </div>
          <div className="progress-bar" style={{ height: 3 }}>
            <motion.div className="progress-fill" style={{ width: `${prog}%`, background: '#4f46e5' }} />
          </div>
        </div>
      )}

      <div className="px-3 pb-4 border-t border-[#1e293b] pt-3 flex items-center gap-2.5">
        <Avatar name={user?.name} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate text-[#f8fafc]">{user?.name}</div>
          <div className="text-[10px] text-[#64748b] capitalize">{user?.role}</div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="text-[11px] text-[#64748b] hover:text-white border border-[#253552] px-2 py-1 transition-colors"
        >
          Out
        </button>
      </div>
    </aside>
  );
};

export const Topbar = ({ title }) => {
  const { user }        = useAuth();
  const { unreadCount } = useNotifications();
  const navigate        = useNavigate();
  const [search, setSearch] = useState('');

  return (
    <header className="h-14 border-b border-[#1e293b] flex items-center px-5 gap-4 flex-shrink-0 bg-[#081225]">
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center bg-[#10192f] border border-[#1e293b] px-3 py-1.5 w-44">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            onKeyDown={e => e.key === 'Enter' && navigate(`/students?q=${search}`)}
            className="bg-transparent text-xs text-[#94a3b8] outline-none w-full placeholder:text-[#64748b]"
          />
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="text-xs text-[#94a3b8] border border-[#1e293b] px-2.5 py-1.5 hover:bg-[#10192f] transition-colors relative"
        >
          Alerts
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#4f46e5] text-white text-[9px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity">
          <Avatar name={user?.name} size={28} />
        </button>
      </div>
    </header>
  );
};

export const Layout = ({ children, title = 'SkillSphere' }) => (
  <div className="flex h-screen overflow-hidden bg-[#030b1d]">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title={title} />
      <main className="flex-1 overflow-y-auto p-5 md:p-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {children}
        </motion.div>
      </main>
    </div>
  </div>
);
