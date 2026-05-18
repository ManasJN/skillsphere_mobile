import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import BrandLogo from '../components/brand/BrandLogo';
import toast from 'react-hot-toast';

const dashboardPath = (user) => {
  if (user.role === 'college') return '/college';
  if (user.role === 'admin') return '/internal/admin';
  return '/dashboard';
};

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem('verifyEmail');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) return toast.error('Enter the OTP sent to your email');
    setLoading(true);
    try {
      const user = await verifyOtp(email, otp);
      localStorage.removeItem('verifyEmail');
      toast.success('Email verified successfully');
      navigate(dashboardPath(user));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030b1d] text-[#f8fafc] p-4">
      <form onSubmit={handleVerify} className="bg-[#0b1630] border border-[#1e2d4a] p-8 w-full max-w-sm shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <BrandLogo className="mb-7" />
        <h2 className="text-xl font-bold mb-2">Verify your email</h2>
        <p className="mb-5 text-sm text-[#64748b]">Enter the OTP sent to <span className="font-semibold text-[#f8fafc]">{email}</span>.</p>
        <Input label="One-time password" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6 digit code" />
        <Button type="submit" loading={loading} className="w-full mt-5">Verify account</Button>
      </form>
    </div>
  );
}
