
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, Medicine, IntakeLog, User } from './types';
import { INITIAL_MEDICINES, Icons } from './constants';
import Sidebar from './components/Sidebar';
import PatientDashboard from './components/PatientDashboard';
import HealthReports from './components/HealthReports';
import MediBot from './components/MediBot';
import MedicineModal from './components/MedicineModal';
import NotificationToast from './components/NotificationToast';
import Auth from './components/Auth';
import { generateVoiceReminder } from './services/geminiService';

// Audio Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [activeNotification, setActiveNotification] = useState<Medicine | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('active_med_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedLogs = localStorage.getItem(`med_logs_${user.id}`);
      const savedMeds = localStorage.getItem(`med_list_${user.id}`);
      
      setMedicines(savedMeds ? JSON.parse(savedMeds) : (user.role === UserRole.PATIENT ? INITIAL_MEDICINES : []));
      setLogs(savedLogs ? JSON.parse(savedLogs) : []);

      setActiveTab('dashboard');

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const handleLogout = () => {
    sessionStorage.removeItem('active_med_user');
    setUser(null);
  };

  const playVoiceReminder = async (medicine: Medicine, isFollowUp: boolean) => {
    initAudio();
    if (!audioContextRef.current) return;

    try {
      const greeting = isFollowUp 
        ? `Attention ${user?.name}. This is a repeat reminder.` 
        : `Hello ${user?.name}. It is now time for your medication.`;
      
      const prompt = `${greeting} Please take ${medicine.dosage} of ${medicine.name}. ${medicine.instructions ? `Note: ${medicine.instructions}` : ''} This English voice note will repeat every 5 minutes until you confirm it is taken.`;
      
      const base64Audio = await generateVoiceReminder(prompt);
      
      if (base64Audio) {
        const audioBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (err) {
      console.error("Voice reminder failed:", err);
    }
  };

  const handleMarkStatus = useCallback((medicineId: string, status: 'taken' | 'missed') => {
    if (!user) return;
    const newLog: IntakeLog = {
      id: Math.random().toString(36).substr(2, 9),
      medicineId,
      timestamp: new Date().toISOString(),
      status
    };
    
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem(`med_logs_${user.id}`, JSON.stringify(updatedLogs));
  }, [logs, user]);

  useEffect(() => {
    if (!user || user.role !== UserRole.PATIENT) return;
    
    const checkReminders = () => {
      const now = new Date();
      const nowTs = now.getTime();
      const todayStr = now.toISOString().split('T')[0];

      medicines.forEach(med => {
        const [medH, medM] = med.time.split(':').map(Number);
        const medTimeToday = new Date();
        medTimeToday.setHours(medH, medM, 0, 0);

        if (nowTs >= medTimeToday.getTime()) {
          const log = logs.find(l => l.medicineId === med.id && l.timestamp.startsWith(todayStr));
          
          if (!log) {
            const reminderKey = `remind_track_${user.id}_${med.id}_${todayStr}`;
            const lastRemindedStr = localStorage.getItem(reminderKey);
            const lastTime = lastRemindedStr ? parseInt(lastRemindedStr, 10) : 0;
            const fiveMinutesInMs = 5 * 60 * 1000;

            if (lastTime === 0 || (nowTs - lastTime) >= fiveMinutesInMs) {
              const isFollowUp = lastTime !== 0;
              setActiveNotification(med);
              localStorage.setItem(reminderKey, nowTs.toString());
              playVoiceReminder(med, isFollowUp);

              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`MediTrack Reminder: ${med.name}`, {
                  body: `Time for your ${med.dosage} dose.`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png'
                });
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [medicines, logs, user, initAudio]);

  const handleSaveMedicine = (medicine: Medicine) => {
    if (!user) return;
    let updatedMeds;
    if (editingMedicine) {
      updatedMeds = medicines.map(m => m.id === medicine.id ? medicine : m);
    } else {
      updatedMeds = [...medicines, medicine];
    }
    setMedicines(updatedMeds);
    localStorage.setItem(`med_list_${user.id}`, JSON.stringify(updatedMeds));
    setEditingMedicine(null);
  };

  const handleDeleteMedicine = (id: string) => {
    if (!user) return;
    const updatedMeds = medicines.filter(m => m.id !== id);
    setMedicines(updatedMeds);
    localStorage.setItem(`med_list_${user.id}`, JSON.stringify(updatedMeds));
    setEditingMedicine(null);
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); sessionStorage.setItem('active_med_user', JSON.stringify(u)); initAudio(); }} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PatientDashboard medicines={medicines} logs={logs} onMarkStatus={handleMarkStatus} onDeleteMedicine={handleDeleteMedicine} userName={user.name} />;
      case 'medicines':
        return (
          <div className="bg-white rounded-3xl p-8 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Prescription Schedule</h2>
                <p className="text-slate-500 text-sm">Manage medication timings here</p>
              </div>
              <button onClick={() => { setEditingMedicine(null); setIsModalOpen(true); initAudio(); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <Icons.Plus /> Add Medicine
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicines.map(med => (
                <div key={med.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50 flex flex-col justify-between hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                      <Icons.Pill />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingMedicine(med); setIsModalOpen(true); }} className="text-slate-300 hover:text-blue-600 transition-colors p-1" title="Edit"><Icons.Settings /></button>
                      <button onClick={() => handleDeleteMedicine(med.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1" title="Remove"><Icons.Trash /></button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{med.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-600 font-black text-sm">{med.time}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-500 text-xs font-bold">{med.dosage}</span>
                    </div>
                    <p className="text-[10px] text-blue-500 font-black mt-3 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> Voice Active
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'assistant':
        return <MediBot userName={user.name} />;
      case 'reports':
        return <HealthReports medicines={medicines} logs={logs} userName={user.name} />;
      default:
        return <PatientDashboard medicines={medicines} logs={logs} onMarkStatus={handleMarkStatus} onDeleteMedicine={handleDeleteMedicine} userName={user.name} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:ml-64 lg:p-10 pt-20 md:pt-10">
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>

      {activeNotification && (
        <NotificationToast 
          medicine={activeNotification} 
          onClose={() => setActiveNotification(null)} 
          onTaken={(id) => handleMarkStatus(id, 'taken')} 
        />
      )}
      
      <MedicineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMedicine} 
        onDelete={handleDeleteMedicine} 
        initialData={editingMedicine} 
      />
    </div>
  );
};

export default App;
