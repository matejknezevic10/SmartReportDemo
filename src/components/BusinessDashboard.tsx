
import React, { useState, useMemo, useRef } from 'react';
import { Report, User, UserRole, Company } from '../types';
import { Users, FileText, Search, UserPlus, Mail, User as UserIcon, Calendar, ArrowRight, Trash2, Edit3, X, Check, Key, Settings, Image as ImageIcon, Building2, Upload, Hash, Copy } from 'lucide-react';

interface BusinessDashboardProps {
  reports: Report[];
  team: User[];
  company: Company;
  onUpdateTeam: (team: User[]) => void;
  onUpdateCompany: (company: Company) => void;
  onOpenReport: (id: string) => void;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ reports, team, company, onUpdateTeam, onUpdateCompany, onOpenReport }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'archive' | 'settings'>('team');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.TECHNICIAN, password: '' });
  const [copiedKey, setCopiedKey] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  const filteredTeam = useMemo(() => 
    team.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())),
    [team, searchTerm]
  );

  const filteredArchive = useMemo(() => 
    reports.filter(r => r.customer.toLowerCase().includes(searchTerm.toLowerCase()) || r.createdByName.toLowerCase().includes(searchTerm.toLowerCase())),
    [reports, searchTerm]
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCompany({ ...company, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyWorkspaceKey = () => {
    navigator.clipboard.writeText(company.workspaceKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return alert("Fehler");
    if (editingUser) {
      onUpdateTeam(team.map(u => u.id === editingUser.id ? { ...u, name: newUser.name, email: newUser.email, role: newUser.role, password: newUser.password } : u));
    } else {
      onUpdateTeam([...team, { id: 'u-' + Date.now(), companyId: company.id, name: newUser.name, email: newUser.email, role: newUser.role, password: newUser.password }]);
    }
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: UserRole.TECHNICIAN, password: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end md:items-center border-b-2 border-slate-100">
        <div className="flex gap-8">
          {['team', 'archive', 'settings'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              {tab === 'team' ? 'Team' : tab === 'archive' ? 'Archiv' : 'Einstellungen'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
          ))}
        </div>
        {activeTab !== 'settings' && (
          <div className="relative w-full md:w-80 mb-4 md:mb-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Suchen..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        )}
      </div>

      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{team.length} Mitarbeiter bei {company.name}</h3>
            <button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"><UserPlus size={14} /> Einladen</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeam.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">{user.name.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl"><Mail size={14} /> {user.email}</div>
                  <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50"><Key size={14} /> PIN: <span className="font-black">{user.password}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Datum</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kunde</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mitarbeiter</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredArchive.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 text-slate-600 font-bold">{report.date}</td>
                  <td className="px-8 py-5 text-slate-900 font-black">{report.customer}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{report.createdByName}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => onOpenReport(report.id)} className="p-2.5 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><ArrowRight size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Settings size={24} className="text-indigo-600" /> Profil & Branding</h3>
            
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
               <div className="flex items-center gap-3 mb-4 opacity-60">
                 <Hash size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Workspace ID (Zugangscode für Team)</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-2xl font-black tracking-widest">{company.workspaceKey}</span>
                 <button onClick={copyWorkspaceKey} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                   {copiedKey ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                 </button>
               </div>
               <p className="text-[10px] mt-4 opacity-50 font-medium">Geben Sie diesen Code an Ihre Mitarbeiter weiter, damit diese sich einloggen können.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Firmenlogo</label>
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden">
                    {company.logo ? (
                      <img src={company.logo} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="text-slate-200" size={32} />
                    )}
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all"><Upload size={18} /> Logo hochladen</button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Offizieller Firmenname</label>
                <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 bg-slate-50 focus:border-indigo-600 outline-none font-bold" value={company.name} onChange={(e) => onUpdateCompany({ ...company, name: e.target.value })} />
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-10 rounded-[3rem] text-white space-y-4">
            <h3 className="text-xl font-black uppercase tracking-tight">System-Vorschau</h3>
            <p className="text-indigo-100 text-sm font-medium">Vorschau des Briefkopfs für PDF/Word Dokumente.</p>
            <div className="bg-white p-8 rounded-[2rem] text-slate-900 shadow-2xl">
              <div className="flex justify-between items-start mb-12">
                 {company.logo ? <img src={company.logo} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-slate-100 rounded-xl" />}
                 <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{company.name}</p>
                   <p className="text-[8px] text-slate-400 mt-1">SmartReport Document Engine</p>
                 </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
                <div className="h-3 w-1/4 bg-slate-50 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 overflow-hidden">
            <h3 className="text-xl font-black uppercase mb-8">Mitarbeiter-Account anlegen</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Name" className="w-full border-2 border-slate-100 rounded-2xl p-4 bg-slate-50 outline-none font-bold" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full border-2 border-slate-100 rounded-2xl p-4 bg-slate-50 outline-none font-bold" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="border-2 border-slate-100 rounded-2xl p-4 bg-slate-50 font-bold outline-none" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}>
                  <option value={UserRole.TECHNICIAN}>Techniker</option>
                  <option value={UserRole.MANAGER}>Büro</option>
                </select>
                <input type="text" placeholder="PIN" className="border-2 border-slate-100 rounded-2xl p-4 bg-slate-50 outline-none font-bold text-center" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddUserModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Abbruch</button>
                <button onClick={handleAddUser} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Freischalten</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
