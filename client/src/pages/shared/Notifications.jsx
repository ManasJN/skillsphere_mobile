import React from 'react';
import { Layout } from '../../components/layout';
import { Button, Spinner, EmptyState } from '../../components/ui';
import { useNotifications } from '../../hooks';
import { timeAgo } from '../../utils';

export default function Notifications() {
  const { notifs, loading, markRead, markAllRead } = useNotifications();
  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <Layout title="Notifications">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-[#64748b]">
          {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
        </span>
        {unread > 0 && (
          <Button variant="ghost" className="text-xs" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {loading
          ? <div className="flex justify-center py-12"><Spinner size={28} /></div>
          : notifs.length === 0
            ? <EmptyState title="No notifications" desc="You are all caught up." />
            : notifs.map((n, i) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`flex gap-3 px-5 py-4 border-b border-[#1e2d4a] last:border-0 cursor-pointer
                  hover:bg-[#0b1630] transition-colors ${!n.isRead ? 'bg-indigo/[0.03]' : ''}`}
              >
                {/* unread dot */}
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ background: n.isRead ? '#253552' : (n.color || '#4f46e5') }}
                />

                {/* icon */}
                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold mb-0.5 ${n.isRead ? 'text-[#94a3b8]' : 'text-[#f1f5f9]'}`}>
                    {n.title}
                  </div>
                  <div className="text-xs text-[#64748b] leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-[#334155] mt-1.5">{timeAgo(n.createdAt)}</div>
                </div>

                {/* unread indicator right */}
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-indigo flex-shrink-0 mt-2" />
                )}
              </div>
            ))
        }
      </div>
    </Layout>
  );
}
