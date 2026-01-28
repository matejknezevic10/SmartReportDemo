# SmartReport 🚀

Die smarte Plattform für Außendienst-Profis zur Erstellung von Berichten und Angeboten in Sekunden mit KI.

## Features

- 📝 **KI-gestützte Berichtserstellung** - Schadensberichte, Inspektionsberichte und Angebote in Sekunden
- 🎤 **Spracherkennung** - Befunde per Sprache eingeben
- 📸 **Bildintegration** - Fotos direkt im Bericht einbinden
- 👥 **Multi-Tenant SaaS** - Mehrere Firmen/Mandanten unterstützt
- 📊 **Manager Dashboard** - Team- und Berichtsverwaltung
- 📱 **Responsive Design** - Funktioniert auf Desktop und Mobile
- ⚡ **Offline-Fähig** - Entwürfe auch ohne Internet erstellen

## Deployment auf Vercel

### 1. Repository erstellen
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Auf GitHub pushen
```bash
gh repo create smartreport --public
git push -u origin main
```

### 3. Vercel Deployment
1. Gehe zu [vercel.com](https://vercel.com)
2. "Add New Project" → GitHub Repository importieren
3. **Environment Variable** hinzufügen:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Dein Gemini API Key (von [Google AI Studio](https://makersuite.google.com/app/apikey))
4. Deploy klicken

### Oder per Vercel CLI:
```bash
npm i -g vercel
vercel --prod
```

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
# Dann VITE_GEMINI_API_KEY in .env eintragen

# Entwicklungsserver starten
npm run dev
```

## Demo-Accounts

Die App kommt mit zwei Demo-Firmen:

| Workspace Code | Firma | Benutzer | PIN |
|----------------|-------|----------|-----|
| SANEO-PRO | Saneo GmbH | Admin Saneo | 1234 |
| TEST-123 | Beispiel Sanierung | Techniker Beispiel | 0000 |

## Tech Stack

- ⚛️ React 18 + TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🤖 Google Gemini AI
- 📄 jsPDF für PDF-Export

## Projektstruktur

```
smartreport/
├── src/
│   ├── components/
│   │   ├── BusinessDashboard.tsx
│   │   ├── ImageEditor.tsx
│   │   ├── Login.tsx
│   │   ├── ReportCard.tsx
│   │   ├── ReportEditor.tsx
│   │   └── TemplateManager.tsx
│   ├── services/
│   │   └── geminiService.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Lizenz

MIT
