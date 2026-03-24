
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Icons } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const getAllUsers = (): (User & { password?: string })[] => {
    const users = localStorage.getItem('med_all_users');
    return users ? JSON.parse(users) : [];
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }

    const allUsers = getAllUsers();

    if (isLogin) {
      // Login Logic
      const foundUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!foundUser) {
        setError('User not found');
        return;
      }
      if (foundUser.password !== password) {
        setError('Incorrect password');
        return;
      }
      // Success
      const { password: _, ...userWithoutPassword } = foundUser;
      onLogin(userWithoutPassword as User);
    } else {
      // Register Logic
      const userExists = allUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
      if (userExists) {
        setError('Username already taken');
        return;
      }

      const newUser: User & { password?: string } = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        name,
        role,
        password
      };

      const updatedUsers = [...allUsers, newUser];
      localStorage.setItem('med_all_users', JSON.stringify(updatedUsers));
      
      const { password: _, ...userWithoutPassword } = newUser;
      onLogin(userWithoutPassword as User);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-xl shadow-blue-200">
            M
          </div>
          <h1 className="text-2xl font-black text-slate-800">MediTrack</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? 'Welcome back, please login' : 'Smart Healthcare Companion'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icons.User />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5">Username</label>
              <input
                required
                type="text"
                placeholder="Your username"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5">Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center border border-rose-100 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all mt-2"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="w-full text-slate-400 text-xs font-bold hover:text-blue-600 transition-colors py-2"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 mt-8 uppercase tracking-widest font-black">
          MediTrack Secure Access
        </p>
      </div>
    </div>
  );
};

export default Auth;
