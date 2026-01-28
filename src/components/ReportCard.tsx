import React from 'react';
import { Report, ReportType } from '../types';
import { AlertTriangle, CheckCircle, Briefcase, FileText, Clock, User } from 'lucide-react';

interface ReportCardProps {
  report: Report;
  onClick: (id: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClick }) => {
  const getTypeIcon = () => {
    switch (report.type) {
      case ReportType.DAMAGE:
        return <AlertTriangle size={20} className="text-red-500" />;
      case ReportType.INSPECTION:
        return <CheckCircle size={20} className="text-blue-500" />;
      case ReportType.OFFER:
        return <Briefcase size={20} className="text-green-500" />;
      default:
        return <FileText size={20} className="text-slate-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (report.type) {
      case ReportType.DAMAGE:
        return 'Schaden';
      case ReportType.INSPECTION:
        return 'Inspektion';
      case ReportType.OFFER:
        return 'Angebot';
      default:
        return 'Bericht';
    }
  };

  const getTypeColor = () => {
    switch (report.type) {
      case ReportType.DAMAGE:
        return 'bg-red-50 text-red-600 border-red-100';
      case ReportType.INSPECTION:
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case ReportType.OFFER:
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusColor = () => {
    switch (report.status) {
      case 'Draft':
        return 'bg-amber-50 text-amber-600';
      case 'Sent':
        return 'bg-blue-50 text-blue-600';
      case 'Completed':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLabel = () => {
    switch (report.status) {
      case 'Draft':
        return 'Entwurf';
      case 'Sent':
        return 'Gesendet';
      case 'Completed':
        return 'Abgeschlossen';
      default:
        return report.status;
    }
  };

  return (
    <div 
      onClick={() => onClick(report.id)}
      className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getTypeColor()}`}>
          {getTypeIcon()}
          <span className="text-[10px] font-black uppercase tracking-wider">{getTypeLabel()}</span>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
      </div>

      <h3 className="font-black text-slate-800 text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
        {report.customer}
      </h3>

      <p className="text-slate-400 text-sm line-clamp-2 mb-4">
        {report.content.substring(0, 120)}...
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span className="text-xs font-medium">{report.date}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <User size={14} />
          <span className="text-xs font-medium truncate max-w-[120px]">{report.createdByName}</span>
        </div>
      </div>

      {report.isOfflineDraft && (
        <div className="mt-3 px-3 py-2 bg-amber-50 rounded-xl">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            ⚡ Offline-Entwurf - Synchronisierung ausstehend
          </span>
        </div>
      )}

      {report.images && report.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-hidden">
          {report.images.slice(0, 3).map((img, idx) => (
            <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={`data:${img.mimeType};base64,${img.data}`} 
                alt={`Bild ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {report.images.length > 3 && (
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-500">+{report.images.length - 3}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportCard;
