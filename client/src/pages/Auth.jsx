import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Select, Tabs } from '../components/ui';
import BrandLogo from '../components/brand/BrandLogo';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER'];

const AuthShell = ({ children, caption }) => (
  <div className="min-h-screen bg-[#030b1d] text-[#f8fafc] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="w-full max-w-md bg-[#0b1630] border border-[#1e2d4a] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
    >
      <BrandLogo className="justify-center mb-2" />
      <p className="text-center text-sm text-[#64748b] mb-7">{caption}</p>
      {children}
    </motion.div>
  </div>
);

const dashboardPath = (user) => {
  if (user.role === 'college') return '/college';
  if (user.role === 'admin') return '/internal/admin';
  return '/dashboard';
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(dashboardPath(user));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell caption="Sign in with your student or college account">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Email" type="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} />
        <Button variant="primary" loading={loading} className="w-full py-2.5 mt-1">Sign in</Button>
      </form>

      <p className="text-center text-xs text-[#64748b] mt-6">
        New here? <Link to="/register" className="text-[#93c5fd] font-semibold hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function Register() {
  const { register, registerCollege } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('student');
  const [student, setStudent] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'CSE',
    semester: 1,
    rollNumber: '',
  });
  const [college, setCollege] = useState({
    collegeName: '',
    officialEmail: '',
    website: '',
    password: '',
    representativeName: '',
    representativeDesignation: '',
    representativePhone: '',
    representativeEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const setStudentField = (k) => (e) => setStudent((p) => ({ ...p, [k]: e.target.value }));
  const setCollegeField = (k) => (e) => setCollege((p) => ({ ...p, [k]: e.target.value }));

  const submitStudent = async (e) => {
    e.preventDefault();
    if (!student.name || !student.email || !student.password) return toast.error('Please fill required fields');
    if (student.password !== student.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = student;
      await register(payload);
      localStorage.setItem('verifyEmail', student.email);
      toast.success('OTP sent to your email');
      navigate('/verify-otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const submitCollege = async (e) => {
    e.preventDefault();
    if (!college.collegeName || !college.officialEmail || !college.password || !college.representativeName || !college.representativeDesignation) {
      return toast.error('Please fill the required college fields');
    }
    setLoading(true);
    try {
      await registerCollege(college);
      localStorage.setItem('verifyEmail', college.officialEmail);
      toast.success('OTP sent to official college email');
      navigate('/verify-otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'College registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell caption="Join a verified college ecosystem">
      <Tabs
        active={accountType}
        onChange={setAccountType}
        tabs={[
          { value: 'student', label: 'Student' },
          { value: 'college', label: 'College' },
        ]}
      />

      {accountType === 'student' ? (
        <form onSubmit={submitStudent} className="flex flex-col gap-3 mt-5">
          <Input label="Full name *" placeholder="Arjun Mehta" value={student.name} onChange={setStudentField('name')} />
          <Input label="Email *" type="email" placeholder="you@college.edu" value={student.email} onChange={setStudentField('email')} />
          <Input label="Password *" type="password" placeholder="Minimum 8 characters" value={student.password} onChange={setStudentField('password')} />
          <Input label="Confirm password *" type="password" placeholder="Re-enter password" value={student.confirmPassword} onChange={setStudentField('confirmPassword')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={student.department} onChange={setStudentField('department')} options={DEPARTMENTS.map((v) => ({ value: v, label: v }))} />
            <Select label="Semester" value={student.semester} onChange={setStudentField('semester')} options={[1,2,3,4,5,6,7,8].map((v) => ({ value: v, label: `Sem ${v}` }))} />
          </div>
          <Input label="Roll number" placeholder="21CS047" value={student.rollNumber} onChange={setStudentField('rollNumber')} />
          <Button variant="primary" loading={loading} className="w-full py-2.5 mt-1">Create student account</Button>
        </form>
      ) : (
        <form onSubmit={submitCollege} className="flex flex-col gap-3 mt-5">
          <Input label="College name *" placeholder="National Institute of Technology" value={college.collegeName} onChange={setCollegeField('collegeName')} />
          <Input label="Official college email *" type="email" placeholder="office@college.edu" value={college.officialEmail} onChange={setCollegeField('officialEmail')} />
          <Input label="Website" placeholder="https://college.edu" value={college.website} onChange={setCollegeField('website')} />
          <Input label="Password *" type="password" placeholder="Minimum 8 characters" value={college.password} onChange={setCollegeField('password')} />
          <Input label="Authorized representative *" placeholder="Dr. Ananya Roy" value={college.representativeName} onChange={setCollegeField('representativeName')} />
          <Input label="Designation *" placeholder="Dean of Student Affairs" value={college.representativeDesignation} onChange={setCollegeField('representativeDesignation')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={college.representativePhone} onChange={setCollegeField('representativePhone')} />
            <Input label="Representative email" type="email" value={college.representativeEmail} onChange={setCollegeField('representativeEmail')} />
          </div>
          <Button variant="primary" loading={loading} className="w-full py-2.5 mt-1">Register college</Button>
        </form>
      )}

      <p className="text-center text-xs text-[#64748b] mt-5">
        Already have an account? <Link to="/login" className="text-[#93c5fd] font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
