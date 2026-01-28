
import React, { useState } from 'react';
import { User, Company } from '../types';
import { Sparkles, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, Building2, Hash } from 'lucide-react';

interface LoginProps {
  companies: Company[];
  users: User[];
  onLogin: (user: User, company: Company) => void;
}

const Login: React.FC<LoginProps> = ({ companies, users, onLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundCompany, setFoundCompany] = useState<Company | null>(null);

  const handleIdentifyWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation einer API-Abfrage
    setTimeout(() => {
      const company = companies.find(c => 
        c.workspaceKey.toLowerCase() === workspaceInput.toLowerCase().trim()
      );

      if (company) {
        setFoundCompany(company);
        setStep(2);
        setError('');
      } else {
        setError('Workspace-Code nicht gefunden. Bitte prüfen Sie Ihre Eingabe.');
      }
      setIsLoading(false);
    }, 600);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedUserId) return setError('Bitte Mitarbeiter auswählen.');
    if (!password) return setError('Bitte Passwort eingeben.');

    setIsLoading(true);
    
    setTimeout(() => {
      const user = users.find(u => u.id === selectedUserId);
      if (user && user.password === password && foundCompany) {
        onLogin(user, foundCompany);
      } else {
        setError('Passwort nicht korrekt.');
      }
      setIsLoading(false);
    }, 800);
  };

  const companyUsers = foundCompany ? users.filter(u => u.companyId === foundCompany.id) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-[2rem] text-white shadow-2xl mb-6">
            <Sparkles size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">SmartReport</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Enterprise SaaS Portal</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
          {step === 1 ? (
            <form onSubmit={handleIdentifyWorkspace} className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-black text-slate-800 uppercase">Workspace betreten</h2>
                <p className="text-xs text-slate-400 font-medium">Geben Sie Ihren Firmen-Code ein</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Firmen-Code (Workspace ID)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="z.B. saneo-pro"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 font-bold text-slate-700 outline-none focus:border-slate-900 transition-all text-center uppercase tracking-widest"
                    value={workspaceInput}
                    onChange={(e) => setWorkspaceInput(e.target.value)}
                    autoFocus
                  />
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl animate-shake">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading || !workspaceInput}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>Workspace finden <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {foundCompany?.logo ? (
                   <img src={foundCompany.logo} className="h-10 w-10 object-contain" />
                ) : (
                   <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">{foundCompany?.name.charAt(0)}</div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Willkommen bei</p>
                  <p className="font-black text-slate-800 truncate">{foundCompany?.name}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Code ändern</button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Mitarbeiter wählen</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 font-bold text-slate-700 outline-none focus:border-indigo-600 appearance-none cursor-pointer transition-all"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Name wählen...</option>
                    {companyUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Passwort / PIN</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all text-center tracking-[0.5em]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

              <button 
                disabled={isLoading}
                type="submit" 
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Anmelden"}
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-[9px] font-bold uppercase tracking-[0.4em]">
          Isolated Multi-Tenant Security Active
        </p>
      </div>
    </div>
  );
};

export default Login;
