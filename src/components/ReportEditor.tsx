import React, { useState, useMemo, useRef } from 'react';
import { Report, ReportType, User, ReportImage } from '../types';
import { ArrowLeft, Copy, Check, FileDown, Image as ImageIcon, Mail, Loader2, Sparkles, Edit3, CheckCircle, Eye, Edit } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let listType: 'ol' | 'ul' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.startsWith('### ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^### /, '');
      html += `<h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <span style="width: 6px; height: 6px; background: #6366f1; border-radius: 50%; display: inline-block;"></span>${text}
      </h3>`;
      continue;
    }
    
    if (line.startsWith('## ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^## /, '');
      html += `<h2 style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 32px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #6366f1; text-transform: uppercase; letter-spacing: 1px;">${text}</h2>`;
      continue;
    }
    
    if (line.startsWith('# ')) {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      const text = line.replace(/^# /, '');
      html += `<h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 20px;">${text}</h1>`;
      continue;
    }
    
    if (line.trim() === '---') {
      if (inList) { html += listType === 'ol' ? '</ol>' : '</ul>'; inList = false; }
      html += '<hr style="margin: 28px 0; border: none; border-top: 2px solid #e2e8f0;" />';
      continue;
    }
    
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += '</ul>';
        html += '<ol style="list-style-type: decimal; margin-left: 24px; margin-bottom: 20px;">';
        inList = true;
        listType = 'ol';
      }
      const content = numberedMatch[2]
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
      html += `<li style="color: #475569; line-height: 1.7; margin-bottom: 8px; padding-left: 8px;">${content}</li>`;
      continue;
    }
    
    if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) html += '</ol>';
        html += '<ul style="list-style-type: disc; margin-left: 24px; margin-bottom: 20px;">';
        inList = true;
        listType = 'ul';
      }
      const content = line.replace(/^- /, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
      html += `<li style="color: #475569; line-height: 1.7; margin-bottom: 8px; padding-left: 8px;">${content}</li>`;
      continue;
    }
    
    if (inList && line.trim() !== '') {
      html += listType === 'ol' ? '</ol>' : '</ul>';
      inList = false;
      listType = null;
    }
    
    if (line.trim() === '') {
      continue;
    }
    
    let paragraph = line
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #0f172a;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    html += `<p style="color: #475569; line-height: 1.8; margin-bottom: 16px;">${paragraph}</p>`;
  }
  
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
  
  const reportRef = useRef<HTMLDivElement>(null);

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

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    
    // Force preview mode for export
    const wasEditMode = viewMode === 'edit';
    if (wasEditMode) setViewMode('preview');
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Clone the element to avoid modifying the original
      const element = reportRef.current;
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Set fixed width for consistent PDF output
      clone.style.width = '800px';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // Remove any problematic elements
          const textareas = clonedDoc.getElementsByTagName('textarea');
          Array.from(textareas).forEach(ta => {
            const div = clonedDoc.createElement('div');
            div.innerHTML = ta.value.replace(/\n/g, '<br>');
            div.style.cssText = ta.style.cssText;
            ta.parentNode?.replaceChild(div, ta);
          });
        }
      });
      
      // Remove clone
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit width
      const scale = pdfWidth / (imgWidth / 2); // Divide by 2 because of scale: 2
      const scaledHeight = (imgHeight / 2) * scale;
      
      // If content fits on one page
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
      } else {
        // Multi-page handling
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const pageHeightInPx = (pdfHeight / scale) * 2; // Convert to canvas pixels
        
        while (remainingHeight > 0) {
          const sliceHeight = Math.min(pageHeightInPx, remainingHeight);
          
          // Create temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0, sourceY, imgWidth, sliceHeight,
              0, 0, imgWidth, sliceHeight
            );
            
            const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const pageScaledHeight = (sliceHeight / 2) * scale;
            
            if (sourceY > 0) {
              pdf.addPage();
            }
            
            pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pageScaledHeight);
          }
          
          sourceY += sliceHeight;
          remainingHeight -= sliceHeight;
        }
      }
      
      pdf.save(`Bericht_${report.customer.replace(/\s+/g, '_')}_${report.date.replace(/\./g, '-')}.pdf`);
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      // Fallback to simple PDF
      try {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(report.title.toUpperCase(), margin, 18);
        doc.setFontSize(9);
        doc.text(`Datum: ${report.date} | Kunde: ${report.customer}`, margin, 28);
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const cleanContent = content
          .replace(/^#+\s*/gm, '')
          .replace(/\*\*/g, '')
          .replace(/^---$/gm, '');
        
        const lines = doc.splitTextToSize(cleanContent, pageWidth - (margin * 2));
        doc.text(lines, margin, 50);
        
        doc.save(`Bericht_${report.customer.replace(/\s+/g, '_')}_${report.date.replace(/\./g, '-')}.pdf`);
      } catch (fallbackError) {
        alert('PDF Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } finally {
      if (wasEditMode) setViewMode('edit');
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
          <div ref={reportRef} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Report Header */}
            <div style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)' }} className="text-white p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ color: '#a5b4fc' }} className="text-xs font-semibold uppercase tracking-wider mb-2">Technischer Bericht</p>
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">{report.title}</h1>
                </div>
                <div className="text-right text-sm">
                  <p style={{ color: '#94a3b8' }}>Datum</p>
                  <p className="font-bold">{report.date}</p>
                </div>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p style={{ color: '#94a3b8' }} className="text-xs">Kunde/Objekt</p>
                    <p className="font-semibold">{report.customer}</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8' }} className="text-xs">Status</p>
                    <p className="font-semibold">{report.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 md:p-10">
              {viewMode === 'preview' ? (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
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
              <div style={{ borderTop: '2px solid #f1f5f9', background: '#f8fafc' }} className="p-6 md:p-10">
                <h3 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-3" style={{ color: '#1e293b' }}>
                  <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '8px', display: 'inline-flex' }}>
                    <ImageIcon size={20} style={{ color: '#4f46e5' }} />
                  </div>
                  Bildmaterial
                  <span className="text-sm font-normal" style={{ color: '#64748b' }}>({report.images.length} Fotos)</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {report.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative rounded-xl overflow-hidden shadow-md cursor-pointer"
                      style={{ aspectRatio: '4/3', border: '2px solid white' }}
                      onClick={() => setEditingImageIndex(idx)}
                    >
                      <img 
                        src={`data:${img.mimeType};base64,${img.data}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={`Foto ${idx + 1}`} 
                      />
                      <div 
                        style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          background: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          borderRadius: '4px' 
                        }}
                      >
                        Foto {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }} className="p-4 text-center">
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Erstellt mit <span style={{ fontWeight: 600, color: '#6366f1' }}>SmartReport</span> • {report.date}
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
          {isExporting ? 'Wird erstellt...' : 'PDF Export'}
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
