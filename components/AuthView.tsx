import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'reset-code' | 'new-password';

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userCount, setUserCount] = useState(0);

  const getUsers = async (): Promise<User[]> => {
    let users: User[] = [];
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        users = data.users || [];
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const saved = localStorage.getItem('zema_users');
      users = saved ? JSON.parse(saved) : [];
    }
    setUserCount(users.length);
    return users;
  };

  const saveUsers = async (users: User[]) => {
    localStorage.setItem('zema_users', JSON.stringify(users));
    setUserCount(users.length);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users })
      });
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  };

  useEffect(() => {
    const initUsers = async () => {
      await getUsers();
    };
    initUsers();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = await getUsers();

    if (mode === 'login') {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password.');
      }
    } else if (mode === 'signup') {
      if (users.length >= 5) {
        setError('Registration is full. Only 5 users allowed.');
        return;
      }
      if (users.find(u => u.email === email)) {
        setError('Email already registered.');
        return;
      }
      const newUser: User = { id: `u_${Date.now()}`, name, email, password };
      saveUsers([...users, newUser]);
      onLogin(newUser);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      setError('Email not found.');
    } else {
      setError('');
      setMode('reset-code');
      // Simulate sending code
      console.log('Verification code 123456 sent to', email);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode === '123456') {
      setMode('new-password');
      setError('');
    } else {
      setError('Invalid code. Use 123456 for demo.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await getUsers();
    const updatedUsers = users.map(u => u.email === email ? { ...u, password: newPassword } : u);
    await saveUsers(updatedUsers);
    setMode('login');
    setError('Password updated successfully. Please login.');
  };

  const handleDevLogin = async () => {
    const devUser: User = {
      id: 'dev_user',
      name: 'Developer',
      email: 'dev@zema.com',
      password: 'dev'
    };
    
    const users = await getUsers();
    if (!users.find(u => u.id === devUser.id)) {
      await saveUsers([...users, devUser]);
    }
    
    onLogin(devUser);
  };

  return (
    <div className="min-h-screen bg-donezo-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-donezo-green/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-eotc-gold/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-eotc-gold to-eotc-red rounded-2xl flex items-center justify-center text-white font-serif text-3xl font-black mx-auto mb-4 shadow-lg shadow-eotc-gold/20">
            Z
          </div>
          <h1 className="text-3xl font-sans font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Join Zema'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset-code' && 'Verify Code'}
            {mode === 'new-password' && 'New Password'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {mode === 'signup' ? 'Access the sacred audio library' : 'Ethiopian Orthodox Liturgical Library'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${error.includes('successfully') ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {error}
          </div>
        )}

        <form onSubmit={
          mode === 'login' || mode === 'signup' ? handleAuth : 
          mode === 'forgot' ? handleForgot : 
          mode === 'reset-code' ? handleVerifyCode : 
          handleResetPassword
        } className="space-y-4">
          
          {(mode === 'signup') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                placeholder="Name"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                placeholder="email@example.com"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-donezo-green transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          {mode === 'reset-code' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">6-Digit Code</label>
              <input 
                required
                type="text" 
                maxLength={6}
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                placeholder="000000"
              />
              <p className="mt-2 text-[10px] text-slate-400 text-center">Enter 123456 for demo</p>
            </div>
          )}

          {mode === 'new-password' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
              <div className="relative">
                <input 
                  required
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-donezo-green transition-colors"
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-donezo-green hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-donezo-green/20 active:scale-95"
          >
            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Send Reset Code'}
            {mode === 'reset-code' && 'Verify Code'}
            {mode === 'new-password' && 'Update Password'}
          </button>
          
          {mode === 'login' && (
            <button 
              type="button"
              onClick={handleDevLogin}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all text-sm"
            >
              Sign in as Developer
            </button>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('signup')} className="text-sm font-bold text-donezo-green hover:underline">Create an account</button>
              <br />
              <button onClick={() => setMode('forgot')} className="text-xs font-bold text-slate-400 hover:text-slate-600">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-sm font-bold text-donezo-green hover:underline">Back to Login</button>
          )}
        </div>

        {mode === 'signup' && (
          <p className="mt-6 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
            {5 - userCount} Slots Remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthView;