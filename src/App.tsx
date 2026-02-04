
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Settings, FileText, LayoutDashboard, History, Loader2, Camera, Image as ImageIcon, X, BookOpen, ChevronDown, AlertTriangle, CheckCircle, Briefcase, BarChart3, Users, LogOut, User as UserIcon, Mail, Mic, MicOff, CloudOff, CloudUpload, Wifi, Edit3, Home, Sparkles, Database, Building2, PenTool } from 'lucide-react';
import { Report, ReportType, GenerationInput, Template, User, UserRole, ReportImage, Company } from './types';
import { generateProfessionalReport } from './services/geminiService';
import ReportCard from './components/ReportCard';
import ReportEditor from './components/ReportEditor';
import BusinessDashboard from './components/BusinessDashboard';
import ImageEditor from './components/ImageEditor';
import Login from './components/Login';
import SketchPad from './components/SketchPad';

const App: React.FC = () => {
  // --- SaaS & SESSION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'dashboard'>('reports');
  
  // --- FEATURES STATE (Speech & Image Editing during Creation) ---
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingImageIndexForNew, setEditingImageIndexForNew] = useState<number | null>(null);
  const [showSketchPad, setShowSketchPad] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [formInput, setFormInput] = useState<GenerationInput>({
    type: ReportType.DAMAGE,
    keywords: '',
    customerName: '',
    additionalInfo: '',
    images: []
  });

  // --- PERSISTENCE & INITIALIZATION ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mandanten laden
    const savedCompanies = localStorage.getItem('saas_companies_db');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    } else {
      const initialCompanies = [
        { id: 'co-saneo', workspaceKey: 'SANEO-PRO', name: 'Saneo GmbH', primaryColor: '#89D900' },
        { id: 'co-beispiel', workspaceKey: 'TEST-123', name: 'Beispiel Sanierung', primaryColor: '#3b82f6' }
      ];
      setCompanies(initialCompanies);
      localStorage.setItem('saas_companies_db', JSON.stringify(initialCompanies));
    }

    // Nutzer laden
    const savedUsers = localStorage.getItem('saas_users_db');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [
        { id: 'u1', companyId: 'co-saneo', name: 'Admin Saneo', role: UserRole.MANAGER, email: 'admin@saneo.de', password: '1234' },
        { id: 'u2', companyId: 'co-beispiel', name: 'Techniker Beispiel', role: UserRole.TECHNICIAN, email: 'tech@beispiel.de', password: '0000' }
      ];
      setAllUsers(initialUsers);
      localStorage.setItem('saas_users_db', JSON.stringify(initialUsers));
    }

    const savedReports = localStorage.getItem('saas_reports_db');
    if (savedReports) setAllReports(JSON.parse(savedReports));
    
    // Session check
    const savedSession = localStorage.getItem('saas_session');
    if (savedSession) {
      const { user, company } = JSON.parse(savedSession);
      setCurrentUser(user);
      setCurrentCompany(company);
      setIsLoggedIn(true);
    }

    // Speech Recognition Setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setFormInput(prev => ({
              ...prev,
              keywords: prev.keywords + ' ' + event.results[i][0].transcript
            }));
          }
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => { if (companies.length > 0) localStorage.setItem('saas_companies_db', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { if (allUsers.length > 0) localStorage.setItem('saas_users_db', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('saas_reports_db', JSON.stringify(allReports)); }, [allReports]);

  // --- ACTIONS ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleLogin = (user: User, company: Company) => {
    setCurrentUser(user);
    setCurrentCompany(company);
    setIsLoggedIn(true);
    localStorage.setItem('saas_session', JSON.stringify({ user, company }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentCompany(null);
    localStorage.removeItem('saas_session');
    setActiveTab('reports');
  };

  const handleSketchSave = (imageData: string) => {
    // Convert data URL to base64 and add as image
    const base64Data = imageData.split(',')[1];
    const newImage: ReportImage = {
      data: base64Data,
      mimeType: 'image/png'
    };
    setFormInput(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }));
    setShowSketchPad(false);
  };

  const handleCreateReport = async () => {
    if (!formInput.keywords || !formInput.customerName || !currentUser || !currentCompany) return alert("Daten unvollständig.");
    setIsLoading(true);

    const inputWithContext = {
      ...formInput,
      companyName: currentCompany.name
    };

    try {
      const result = await generateProfessionalReport(inputWithContext);
      const newReport: Report = {
        id: Date.now().toString(),
        companyId: currentCompany.id,
        type: formInput.type,
        title: `${formInput.type === ReportType.DAMAGE ? 'Schadensbericht' : 'Bericht'} - ${formInput.customerName}`,
        customer: formInput.customerName,
        content: result,
        date: new Date().toLocaleDateString('de-DE'),
        status: 'Draft',
        images: formInput.images,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        rawInput: inputWithContext 
      };
      
      setAllReports([newReport, ...allReports]);
      setSelectedReportId(newReport.id);
      setIsCreating(false);
      setFormInput({ type: ReportType.DAMAGE, keywords: '', customerName: '', additionalInfo: '', images: [] });
    } catch (error) {
      const offlineDraft: Report = {
        id: Date.now().toString(),
        companyId: currentCompany.id,
        type: formInput.type,
        title: `${formInput.type === ReportType.DAMAGE ? 'Schadensbericht' : 'Bericht'} - ${formInput.customerName} (Entwurf)`,
        customer: formInput.customerName,
        content: `ENTWURF - Wartet auf Synchronisierung.\nBefund: ${formInput.keywords}`,
        date: new Date().toLocaleDateString('de-DE'),
        status: 'Draft',
        images: formInput.images,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        isOfflineDraft: true,
        rawInput: inputWithContext 
      };
      
      setAllReports([offlineDraft, ...allReports]);
      setSelectedReportId(offlineDraft.id);
      setIsCreating(false);
      setFormInput({ type: ReportType.DAMAGE, keywords: '', customerName: '', additionalInfo: '', images: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = allReports.filter(r => 
    r.companyId === currentCompany?.id && (
    r.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeReport = allReports.find(r => r.id === selectedReportId);

  if (!isLoggedIn) return <Login companies={companies} users={allUsers} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      <header className="sticky top-0 bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            {currentCompany?.logo ? (
              <img src={currentCompany.logo} className="h-10 w-10 object-contain" alt="Logo" />
            ) : (
              <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Building2 size={24} /></div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">
                {currentCompany?.name} <span className="text-slate-400 font-medium lowercase">| SmartReport</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <p className="text-xs font-black uppercase">{currentUser?.name}</p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{currentUser?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {currentUser?.role === UserRole.MANAGER && (
          <div className="flex p-1.5 bg-slate-200/50 rounded-3xl w-fit mb-4">
            <button onClick={() => setActiveTab('reports')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Berichterstellung</button>
            <button onClick={() => setActiveTab('dashboard')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
          </div>
        )}

        {activeTab === 'dashboard' && currentUser?.role === UserRole.MANAGER ? (
          <BusinessDashboard 
            reports={allReports.filter(r => r.companyId === currentCompany?.id)} 
            team={allUsers.filter(u => u.companyId === currentCompany?.id)} 
            company={currentCompany!}
            onUpdateTeam={(newTeam) => {
               const otherUsers = allUsers.filter(u => u.companyId !== currentCompany?.id);
               setAllUsers([...otherUsers, ...newTeam]);
            }}
            onUpdateCompany={(updated) => {
               setCompanies(companies.map(c => c.id === updated.id ? updated : c));
               setCurrentCompany(updated);
            }}
            onOpenReport={(id) => setSelectedReportId(id)}
          />
        ) : (
          <>
            <div className="relative w-full md:max-w-md mx-auto md:mx-0">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                  type="text" 
                  placeholder="Kunde oder Projekt suchen..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: ReportType.DAMAGE, label: 'Schaden', icon: AlertTriangle, color: 'red' },
                { type: ReportType.INSPECTION, label: 'Inspektion', icon: CheckCircle, color: 'blue' },
                { type: ReportType.OFFER, label: 'Angebot', icon: Briefcase, color: 'green' }
              ].map(item => (
                <button 
                  key={item.type}
                  onClick={() => { setFormInput({...formInput, type: item.type}); setIsCreating(true); }}
                  className="flex items-center gap-5 p-6 bg-white border border-slate-200 rounded-[2.5rem] hover:border-indigo-600 transition-all shadow-sm group"
                >
                  <div className={`p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all`}><item.icon size={28} /></div>
                  <span className="text-base font-black uppercase">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-black flex items-center gap-3 uppercase tracking-tighter"><History size={22} className="text-indigo-600" /> Firmenweite Berichte</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map(report => (
                  <ReportCard key={report.id} report={report} onClick={(id) => setSelectedReportId(id)} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight uppercase">Neuer Bericht</h3>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <input type="text" placeholder="Kunde / Objekt" className="w-full border-2 border-slate-100 rounded-2xl p-5 bg-slate-50 focus:border-indigo-600 outline-none font-bold" value={formInput.customerName} onChange={(e) => setFormInput({...formInput, customerName: e.target.value})} />
                
                <div className="relative">
                  <textarea 
                    rows={4} 
                    placeholder="Befund Stichpunkte..." 
                    className="w-full border-2 border-slate-100 rounded-3xl p-6 bg-slate-50 focus:border-indigo-600 outline-none font-bold resize-none pr-16" 
                    value={formInput.keywords} 
                    onChange={(e) => setFormInput({...formInput, keywords: e.target.value})} 
                  />
                  <button 
                    onClick={toggleRecording}
                    className={`absolute right-4 top-4 p-4 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm'}`}
                  >
                    {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                </div>

                {/* Images and Sketch Grid */}
                <div className="grid grid-cols-4 gap-3">
                    {formInput.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                        <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                          <button 
                            onClick={() => setEditingImageIndexForNew(idx)}
                            className="p-2 bg-white text-indigo-600 rounded-lg shadow-xl"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => setFormInput(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            className="p-2 bg-white text-red-600 rounded-lg shadow-xl"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Camera Button */}
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="aspect-square flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                    >
                      <Camera size={24} />
                      <span className="text-[10px] mt-1 font-bold">Foto</span>
                    </button>
                    
                    {/* Sketch/Floor Plan Button */}
                    <button 
                      onClick={() => setShowSketchPad(true)} 
                      className="aspect-square flex flex-col items-center justify-center bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-100 transition-all"
                    >
                      <PenTool size={24} />
                      <span className="text-[10px] mt-1 font-bold">Grundriss</span>
                    </button>
                    
                    <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={(e) => {
                       const files = e.target.files;
                       if (files) {
                         Array.from(files).forEach((file: File) => {
                           const reader = new FileReader();
                           reader.onloadend = () => {
                             const base64String = (reader.result as string).split(',')[1];
                             setFormInput(prev => ({ ...prev, images: [...prev.images, { data: base64String, mimeType: file.type }] }));
                           };
                           reader.readAsDataURL(file);
                         });
                       }
                    }} className="hidden" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t shrink-0">
              <button onClick={handleCreateReport} disabled={isLoading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Smart Report erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SketchPad Modal */}
      {showSketchPad && (
        <SketchPad 
          onSave={handleSketchSave}
          onClose={() => setShowSketchPad(false)}
        />
      )}

      {editingImageIndexForNew !== null && (
        <ImageEditor 
          image={formInput.images[editingImageIndexForNew]}
          onSave={(updated) => {
            const newImages = [...formInput.images];
            newImages[editingImageIndexForNew] = updated;
            setFormInput(prev => ({ ...prev, images: newImages }));
            setEditingImageIndexForNew(null);
          }}
          onClose={() => setEditingImageIndexForNew(null)}
        />
      )}

      {activeReport && currentUser && currentCompany && (
        <ReportEditor 
          report={activeReport} 
          currentUser={currentUser}
          isOnline={isOnline}
          onBack={() => setSelectedReportId(null)}
          onSave={(updated) => {
            setAllReports(allReports.map(r => r.id === updated.id ? updated : r));
            setSelectedReportId(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
