
import React, { useState } from 'react';
import { Report, ReportType, User, ReportImage } from '../types';
import { Save, ArrowLeft, Copy, Check, FileDown, FileText, Image as ImageIcon, X, Mail, Send, Loader2, CloudUpload, Sparkles, Edit3, Home, CheckCircle, AlertTriangle, MapPin, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateProfessionalReport } from '../services/geminiService';
import ImageEditor from './ImageEditor';

interface ReportEditorProps {
  report: Report;
  currentUser: User;
  isOnline: boolean;
  onSave: (updated: Report) => void;
  onBack: () => void;
}

const ReportEditor: React.FC<ReportEditorProps> = ({ report, currentUser, isOnline, onSave, onBack }) => {
  const [content, setContent] = useState(report.content);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const handleCopy = () => {
    const cleanText = content.replace(/\*\*/g, '').replace(/__/g, '').replace(/^\s*#+\s*/gm, '');
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    if (!report.rawInput) return;
    setIsSyncing(true);
    try {
      const result = await generateProfessionalReport({
        ...report.rawInput,
        customerName: report.customer,
        images: report.images || []
      });
      const updatedReport: Report = {
        ...report,
        content: result,
        isOfflineDraft: false,
        title: report.title.replace(' (Entwurf)', '')
      };
      setContent(result);
      onSave(updatedReport);
    } catch (error) {
      alert("Fehler bei KI-Überarbeitung.");
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(report.title.toUpperCase(), margin, 25);
      doc.setFontSize(8);
      doc.text(`DATUM: ${report.date} | KUNDE: ${report.customer}`, margin, 32);

      // Content
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitContent = doc.splitTextToSize(content, pageWidth - (margin * 2));
      doc.text(splitContent, margin, 55);

      doc.save(`Bericht_${report.customer.replace(/\s+/g, '_')}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const simulateEmailSend = (targetEmail: string) => {
    if (!targetEmail.includes('@')) return alert("Gültige E-Mail erforderlich.");
    setIsSending(true);
    setTimeout(() => { 
      setIsSending(false); 
      setSendSuccess(true); 
      setTimeout(() => {
        setSendSuccess(false);
        setShowEmailModal(false);
      }, 2000); 
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-600"><ArrowLeft size={22} /></button>
          <div>
            <h2 className="font-black uppercase tracking-tight text-slate-900">{report.title}</h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none mt-1">Status: {report.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report.isOfflineDraft && isOnline && (
            <button onClick={handleSync} disabled={isSyncing} className="bg-indigo-600 text-white px-6 py-2 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Generieren
            </button>
          )}
          <button onClick={handleCopy} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-colors">
            {copied ? <Check size={22} /> : <Copy size={22} />}
          </button>
          <button onClick={() => onSave({ ...report, content })} className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-black transition-colors">
            Sichern
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSyncing}
            className="w-full bg-white rounded-[3rem] shadow-xl p-12 text-slate-700 font-medium text-lg leading-relaxed border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-vertical min-h-[600px]"
            placeholder="Berichtsinhalt wird hier angezeigt..."
          />
        </div>

        {report.images && report.images.length > 0 && (
          <div className="w-full md:w-80 bg-white border-l p-8 overflow-y-auto shrink-0">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <ImageIcon size={16} /> Bildmaterial ({report.images.length})
            </h4>
            <div className="space-y-4">
              {report.images.map((img, idx) => (
                <div key={idx} className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-50 shadow-sm group">
                  <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" alt={`Beweis ${idx}`} />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <button onClick={() => setEditingImageIndex(idx)} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-110 active:scale-95"><Edit3 size={24} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t bg-white flex flex-col sm:flex-row justify-between items-center gap-8 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={exportToPDF} disabled={isExporting} className="flex items-center gap-3 px-8 py-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 transition-all active:scale-95 shadow-sm">
            <FileDown size={20} className="text-red-500" /> PDF Export
          </button>
        </div>
        
        <button onClick={() => setShowEmailModal(true)} disabled={!isOnline} className="w-full sm:w-auto flex items-center justify-center gap-3 px-16 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
          <Mail size={22} /> Versand einleiten
        </button>
      </div>

      {editingImageIndex !== null && report.images && (
        <ImageEditor 
          image={report.images[editingImageIndex]}
          onSave={(updated) => {
            const newImages = [...(report.images || [])];
            newImages[editingImageIndex] = updated;
            onSave({ ...report, images: newImages });
            setEditingImageIndex(null);
          }}
          onClose={() => setEditingImageIndex(null)}
        />
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in duration-300">
             {isSending ? (
                <div className="py-6">
                  <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Übertragung läuft...</p>
                </div>
              ) : sendSuccess ? (
                <div className="py-6">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <h3 className="text-xl font-black text-slate-900 uppercase">Versendet!</h3>
                </div>
              ) : (
                <>
                  <Mail className="mx-auto text-indigo-600 mb-4" size={48} />
                  <h3 className="text-xl font-black text-slate-900 uppercase mb-6">Empfänger</h3>
                  <div className="space-y-4">
                    <input 
                      type="email" 
                      placeholder="E-Mail Adresse..." 
                      className="w-full p-4 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none text-center font-bold" 
                      value={manualEmail} 
                      onChange={(e) => setManualEmail(e.target.value)} 
                    />
                    <button onClick={() => simulateEmailSend(manualEmail)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                      Bericht senden
                    </button>
                    <button onClick={() => setShowEmailModal(false)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Abbrechen</button>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportEditor;
