import React, { useState, useMemo } from 'react';
import { Report, ReportType, User, ReportImage } from '../types';
import { ArrowLeft, Copy, Check, FileDown, Image as ImageIcon, Mail, Loader2, Sparkles, Edit3, CheckCircle, Eye, Edit } from 'lucide-react';
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

// Professional Markdown to HTML converter
function markdownToHtml(markdown: string): string {
  // Split into lines for better processing
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let listType: 'ol' | 'ul' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check for headers
    if (line.startsWith('### ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^### /, '');
      html += `<h3 class="text-lg font-bold text-slate-800 mt-8 mb-3 flex items-center gap-2">
        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>${text}
      </h3>`;
      continue;
    }
    
    if (line.startsWith('## ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^## /, '');
      html += `<h2 class="text-xl font-black text-slate-900 mt-10 mb-4 pb-3 border-b-2 border-indigo-500 uppercase tracking-wide">${text}</h2>`;
      continue;
    }
    
    if (line.startsWith('# ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^# /, '');
      html += `<h1 class="text-2xl font-black text-slate-900 mb-6 pb-2">${text}</h1>`;
      continue;
    }
    
    // Horizontal rule
    if (line.trim() === '---') {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      html += '<hr class="my-8 border-t-2 border-slate-200" />';
      continue;
    }
    
    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += '</ul>';
        html += '<ol class="list-decimal list-outside ml-6 mb-6 space-y-2">';
        inList = true;
        listType = 'ol';
      }
      const content = numberedMatch[2]
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      html += `<li class="text-slate-700 leading-relaxed pl-2">${content}</li>`;
      continue;
    }
    
    // Bullet list
    if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) html += '</ol>';
        html += '<ul class="list-disc list-outside ml-6 mb-6 space-y-2">';
        inList = true;
        listType = 'ul';
      }
      const content = line.replace(/^- /, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      html += `<li class="text-slate-700 leading-relaxed pl-2">${content}</li>`;
      continue;
    }
    
    // Close list if we hit a non-list line
    if (inList && line.trim() !== '') {
      html += listType === 'ol' ? '</ol>' : '</ul>';
      inList = false;
      listType = null;
    }
    
    // Empty line
    if (line.trim() === '') {
      continue;
    }
    
    // Regular paragraph
    let paragraph = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    html += `<p class="text-slate-700 leading-relaxed mb-4">${paragraph}</p>`;
  }
  
  // Close any open list
  if (inList) {
    html += listType === 'ol' ? '</ol>' : '</ul>';
  }
  
  return html;
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
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  // Convert markdown to HTML for preview
  const htmlContent = useMemo(() => markdownToHtml(content), [content]);

  const handleCopy = () => {
    const cleanText = content
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^---$/gm, '═══════════════════════════════')
      .replace(/^\d+\.\s+/gm, '• ');
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
      let yPosition = 50;

      // Header
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(report.title.toUpperCase(), margin, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`DATUM: ${report.date} | KUNDE: ${report.customer}`, margin, 30);

      // Content - clean markdown
      const cleanContent = content
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*/g, '')
        .replace(/^---$/gm, '');
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(cleanContent, pageWidth - (margin * 2));
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(lines[i], margin, yPosition);
        yPosition += 5;
      }

      // Add images if present
      if (report.images && report.images.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BILDMATERIAL', margin, 20);
        
        let imgY = 35;
        let imgX = margin;
        const imgWidth = 80;
        const imgHeight = 60;
        
        report.images.forEach((img, idx) => {
          if (imgY + imgHeight > pageHeight - 20) {
            doc.addPage();
            imgY = 20;
          }
          
          try {
            doc.addImage(
              `data:${img.mimeType};base64,${img.data}`,
              'JPEG',
              imgX,
              imgY,
              imgWidth,
              imgHeight
            );
            
            // Alternate left/right
            if (imgX === margin) {
              imgX = margin + imgWidth + 10;
            } else {
              imgX = margin;
              imgY += imgHeight + 10;
            }
          } catch (e) {
            console.error('Image export error:', e);
          }
        });
      }

      doc.save(`Bericht_${report.customer.replace(/\s+/g, '_')}_${report.date.replace(/\./g, '-')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Fehler beim PDF-Export');
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
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:block">
            <h2 className="font-bold text-slate-900 text-sm">{report.title}</h2>
            <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
              {report.status} • {report.date}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View/Edit Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
              }`}
            >
              <Eye size={14} className="inline mr-1" /> Vorschau
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'edit' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
              }`}
            >
              <Edit size={14} className="inline mr-1" /> Bearbeiten
            </button>
          </div>

          {report.isOfflineDraft && isOnline && (
            <button onClick={handleSync} disabled={isSyncing} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
              {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              <span className="hidden sm:inline">Generieren</span>
            </button>
          )}
          
          <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          
          <button onClick={() => onSave({ ...report, content })} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors">
            Sichern
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Report Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">Technischer Bericht</p>
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">{report.title}</h1>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-400">Datum</p>
                  <p className="font-bold">{report.date}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Kunde/Objekt</p>
                  <p className="font-semibold">{report.customer}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Status</p>
                  <p className="font-semibold">{report.status}</p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 md:p-10">
              {viewMode === 'preview' ? (
                <div 
                  className="report-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSyncing}
                  className="w-full min-h-[500px] p-4 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  placeholder="Berichtsinhalt..."
                />
              )}
            </div>

            {/* Images Section */}
            {report.images && report.images.length > 0 && (
              <div className="border-t-2 border-slate-100 p-6 md:p-10 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ImageIcon size={20} className="text-indigo-600" />
                  </div>
                  Bildmaterial
                  <span className="text-sm font-normal text-slate-500">({report.images.length} Fotos)</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group cursor-pointer border-2 border-white hover:border-indigo-300 transition-all" 
                      onClick={() => setEditingImageIndex(idx)}
                    >
                      <img 
                        src={`data:${img.mimeType};base64,${img.data}`} 
                        className="w-full h-full object-cover" 
                        alt={`Foto ${idx + 1}`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-between p-3 transition-all">
                        <span className="text-white text-sm font-semibold">Foto {idx + 1}</span>
                        <Edit3 size={18} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
              <p className="text-xs text-slate-400">
                Erstellt mit <span className="font-semibold text-indigo-500">SmartReport</span> • {report.date}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t p-4 flex justify-between items-center gap-4 flex-shrink-0 shadow-lg">
        <button 
          onClick={exportToPDF} 
          disabled={isExporting} 
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} className="text-red-500" />}
          PDF Export
        </button>
        
        <button 
          onClick={() => setShowEmailModal(true)} 
          disabled={!isOnline} 
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <Mail size={18} /> Versenden
        </button>
      </div>

      {/* Image Editor Modal */}
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            {isSending ? (
              <div className="py-8">
                <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
                <p className="font-bold text-slate-400 uppercase tracking-wide text-sm">Wird gesendet...</p>
              </div>
            ) : sendSuccess ? (
              <div className="py-8">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-900">Versendet!</h3>
              </div>
            ) : (
              <>
                <Mail className="mx-auto text-indigo-600 mb-4" size={40} />
                <h3 className="text-lg font-black text-slate-900 uppercase mb-6">Bericht versenden</h3>
                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="E-Mail Adresse..." 
                    className="w-full p-4 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-center font-medium" 
                    value={manualEmail} 
                    onChange={(e) => setManualEmail(e.target.value)} 
                  />
                  <button 
                    onClick={() => simulateEmailSend(manualEmail)} 
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-indigo-700 transition-all"
                  >
                    Senden
                  </button>
                  <button 
                    onClick={() => setShowEmailModal(false)} 
                    className="w-full py-2 text-slate-400 font-medium text-sm"
                  >
                    Abbrechen
                  </button>
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
