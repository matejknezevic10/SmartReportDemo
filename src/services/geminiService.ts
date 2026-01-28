import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerationInput } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function generateProfessionalReport(input: GenerationInput): Promise<string> {
  if (!genAI) {
    // Fallback wenn kein API Key vorhanden
    return generateFallbackReport(input);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const typeLabels: Record<string, string> = {
      'DAMAGE': 'Schadensbericht',
      'INSPECTION': 'Inspektionsbericht',
      'OFFER': 'Angebot'
    };

    const prompt = `
Du bist ein professioneller Gutachter und Techniker für Gebäudeschäden und Sanierungsarbeiten.
Erstelle einen professionellen ${typeLabels[input.type] || 'Bericht'} basierend auf folgenden Informationen:

Firma: ${input.companyName || 'Fachbetrieb'}
Kunde/Objekt: ${input.customerName}
Befund-Stichpunkte: ${input.keywords}
${input.additionalInfo ? `Zusätzliche Informationen: ${input.additionalInfo}` : ''}

Erstelle einen ausführlichen, professionellen Bericht in deutscher Sprache mit:
- Einleitung mit Datum und Objektangaben
- Detaillierte Beschreibung des Befunds
- Ursachenanalyse (falls relevant)
- Empfohlene Maßnahmen
- Fazit

Der Bericht soll professionell, sachlich und gut strukturiert sein.
Verwende Markdown-Formatierung für bessere Lesbarkeit.
    `.trim();

    // Prüfe ob Bilder vorhanden sind
    const parts: any[] = [{ text: prompt }];
    
    if (input.images && input.images.length > 0) {
      input.images.forEach(img => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        });
      });
      parts.push({ text: '\n\nBitte analysiere auch die beigefügten Bilder und beziehe sie in den Bericht mit ein.' });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return generateFallbackReport(input);
  }
}

function generateFallbackReport(input: GenerationInput): string {
  const date = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const typeLabels: Record<string, string> = {
    'DAMAGE': 'Schadensbericht',
    'INSPECTION': 'Inspektionsbericht',
    'OFFER': 'Angebot'
  };

  const reportType = typeLabels[input.type] || 'Bericht';

  return `# ${reportType}

## Objektinformationen
- **Datum:** ${date}
- **Kunde/Objekt:** ${input.customerName}
- **Erstellt von:** ${input.companyName || 'Fachbetrieb'}

---

## Befundbeschreibung

Bei der Begutachtung des Objekts wurden folgende Feststellungen gemacht:

${input.keywords.split(/[,;.]/).map(k => k.trim()).filter(k => k).map(k => `- ${k}`).join('\n')}

${input.additionalInfo ? `\n### Zusätzliche Informationen\n${input.additionalInfo}` : ''}

---

## Empfohlene Maßnahmen

Basierend auf der Begutachtung empfehlen wir folgende Maßnahmen:

1. Detaillierte Schadensanalyse durch Fachpersonal
2. Dokumentation aller betroffenen Bereiche
3. Erstellung eines detaillierten Sanierungskonzepts
4. Abstimmung mit dem Auftraggeber über das weitere Vorgehen

---

## Fazit

Die oben beschriebenen Befunde erfordern eine zeitnahe Bearbeitung. Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

---

*Dieser Bericht wurde automatisch erstellt und sollte durch einen Fachmann geprüft werden.*

*${input.companyName || 'Fachbetrieb'} • ${date}*
`;
}
