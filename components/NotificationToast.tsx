
import React from 'react';
import { Medicine } from '../types';
import { Icons } from '../constants';

interface NotificationToastProps {
  medicine: Medicine;
  onClose: () => void;
  onTaken: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ medicine, onClose, onTaken }) => {
  return (
    <div className="fixed top-6 right-6 z-[100] w-80 bg-white border border-blue-100 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-top-4 duration-300">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
          <div className="relative">
            <Icons.Bell />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-800">Time for Medicine</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Speaking Reminders Active</span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <Icons.X />
            </button>
          </div>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-800 font-bold">{medicine.name}</p>
            <p className="text-xs text-slate-500 font-medium">{medicine.dosage}</p>
          </div>
          
          <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            <Icons.Calendar /> Repeats every 5 mins until taken
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => {
                onTaken(medicine.id);
                onClose();
              }}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              Mark Taken
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
