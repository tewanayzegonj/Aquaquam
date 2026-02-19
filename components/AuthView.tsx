import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'reset-code' | 'new-password';

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const getUsers = (): User[] => {
    const saved = localStorage.getItem('zema_users');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('zema_users', JSON.stringify(users));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();

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

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
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

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const updatedUsers = users.map(u => u.email === email ? { ...u, password: newPassword } : u);
    saveUsers(updatedUsers);
    setMode('login');
    setError('Password updated successfully. Please login.');
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
          <h1 className="text-3xl font-serif font-black text-slate-900 dark:text-white mb-2">
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
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                placeholder="••••••••"
              />
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
              <input 
                required
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                placeholder="••••••••"
              />
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
            {5 - getUsers().length} Slots Remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthView;