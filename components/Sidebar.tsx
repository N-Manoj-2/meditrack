
import React from 'react';
import { UserRole, User } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Calendar /> },
    { id: 'medicines', label: 'Schedule Meds', icon: <Icons.Pill /> },
    { id: 'assistant', label: 'MediBot AI', icon: <Icons.Bot /> },
    { id: 'reports', label: 'Health Reports', icon: <Icons.Chart /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-40">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="text-xl font-bold text-slate-800">MediTrack</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-10 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Voice Reminders</p>
           </div>
           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">English voice notes play every 5 mins until tablets are taken.</p>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Logged in as</p>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-4">
              <p className="text-xs font-bold text-slate-700 truncate">{user.name}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
          >
            <Icons.X /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
