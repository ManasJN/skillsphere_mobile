import React, { useState } from 'react';
import { Layout } from '../../components/layout';
import { Avatar, Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all fields');
    if (pwForm.newPassword !== pwForm.confirm)          return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 8)                  return toast.error('Min 8 characters');
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Settings">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        {/* Account info */}
        <div className="card">
          <div className="section-title mb-4">Account</div>
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} size={48} />
            <div>
              <div className="font-bold text-base">{user?.name}</div>
              <div className="text-xs text-[#64748b]">{user?.email}</div>
              <div className="text-xs text-[#475569] capitalize mt-0.5">
                {user?.role} · {user?.department}
                {user?.rollNumber ? ` · ${user.rollNumber}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="section-title mb-4">Change password</div>
          <div className="flex flex-col gap-3">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={set('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              value={pwForm.newPassword}
              onChange={set('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={pwForm.confirm}
              onChange={set('confirm')}
            />
            <Button variant="primary" onClick={changePassword} loading={loading} className="mt-1">
              Update Password
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="section-title mb-3">Appearance</div>
          <p className="text-sm text-[#64748b]">Dark theme only for now. Light mode may be added later.</p>
        </div>

        {/* Danger zone */}
        <div className="card border-rose/20">
          <div className="section-title mb-3 text-rose">Sign out</div>
          <p className="text-xs text-[#64748b] mb-4">
            Signing out will clear your session. Your data is saved.
          </p>
          <Button variant="danger" onClick={logout} className="w-full">
            Sign Out of SkillSphere
          </Button>
        </div>
      </div>
    </Layout>
  );
}
