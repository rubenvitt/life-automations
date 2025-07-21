# 📊 Notion-Todoist Analytics

Dieses System bietet umfassende Statistiken und Analysen für die Integration zwischen Notion-Projekten/Lebensbereichen und Todoist-Tasks.

## 🎯 Features

### 1. Projektproduktivität & Fortschritt
- **Completion Rate**: Prozentsatz abgeschlossener vs. aktiver Tasks
- **Task-Übersicht**: Aktive, abgeschlossene und überfällige Tasks pro Projekt
- **Trend-Analyse**: Aufwärts-, Abwärts- oder stabile Entwicklung
- **Wöchentlicher/Monatlicher Fortschritt**: Zeitbasierte Leistungsmessung

### 2. Automatisierte Dashboards
- **Wöchentliche Zusammenfassung**: Top-Performer und Projekte, die Aufmerksamkeit benötigen
- **Monatliche Berichte**: Detaillierte Trend-Analyse und Handlungsempfehlungen
- **Lebensbereich-Balance**: Gleichmäßige Verteilung der Aktivitäten
- **Notion-Integration**: Automatische Erstellung von Notion-Seiten

## 🔗 API Endpoints

### Basis-Analysen
- `GET /analytics/projects/productivity` - Alle Projekte mit Produktivitätsdaten
- `GET /analytics/summary` - Zusammenfassung der Gesamtproduktivität

### Dashboard & Reports
- `GET /analytics/dashboard/weekly` - Wöchentliche Zusammenfassung
- `GET /analytics/dashboard/monthly` - Monatlicher Bericht
- `GET /analytics/dashboard/weekly/notion` - Notion-Format für wöchentliche Zusammenfassung

### Spezielle Abfragen
- `GET /analytics/projects/top-performers?limit=5` - Top-Performance Projekte
- `GET /analytics/projects/needs-attention` - Projekte mit niedrigem Fortschritt
- `GET /analytics/lebensbereiche/overview` - Übersicht aller Lebensbereiche

## 📈 Datenmodelle

### ProjectProductivity
```typescript
interface ProjectProductivity {
  notionProjectId: string;
  notionProjectName: string;
  todoistProjectId?: string;
  lebensbereich?: string;
  completionRate: number;        // Prozent (0-100)
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  weeklyProgress: number;        // Tasks diese Woche abgeschlossen
  monthlyProgress: number;       // Tasks diesen Monat abgeschlossen
  trend: 'up' | 'down' | 'stable';
}
```

### WeeklySummaryReport
```typescript
interface WeeklySummaryReport {
  period: string;                // "01.01.2024 - 07.01.2024"
  generated: string;             // Generierungszeitpunkt
  summary: ProductivitySummary;
  topPerformers: ProjectProductivity[];      // Top 3 Projekte
  needsAttention: ProjectProductivity[];     // Projekte mit Problemen
  lebensbereichInsights: {
    mostActive: string;          // Aktivster Lebensbereich
    leastActive: string;         // Inaktivster Lebensbereich
    balanceScore: number;        // Balance-Score (0-100)
  };
  recommendations: string[];     // Automatische Empfehlungen
}
```

## 🚀 Verwendung

### Basis-Setup
1. Stelle sicher, dass `NOTION_API_KEY` und `TODOIST_API_KEY` konfiguriert sind
2. Notion-Projekte sollten ein "Todoist Projekt" Feld mit der Todoist-Projekt-ID haben
3. Lebensbereiche werden über Notion-Relations verknüpft

### Beispiel-Request
```bash
curl http://localhost:3000/analytics/projects/productivity
```

### Wöchentliche Zusammenfassung abrufen
```bash
curl http://localhost:3000/analytics/dashboard/weekly
```

## 📊 Metriken & KPIs

### Completion Rate
- **Berechnung**: (Abgeschlossene Tasks / Gesamte Tasks) × 100
- **Zeitraum**: Letzten 3 Monate für historische Daten
- **Interpretation**: >80% = Sehr gut, 60-80% = Gut, <60% = Optimierungsbedarf

### Trend-Berechnung
- **Basis**: Vergleich aktueller Monat vs. Vormonat
- **up**: >10% Verbesserung
- **down**: >10% Verschlechterung  
- **stable**: Innerhalb ±10%

### Balance Score
- **Berechnung**: Basiert auf Varianz der Aktivität zwischen Lebensbereichen
- **Range**: 0-100 (100 = perfekte Balance)
- **Verwendung**: Identifikation von über-/unterrepräsentierten Bereichen

## 🛠 Technische Details

### Services
- **AnalyticsService**: Kern-Analysefunktionen und Datenverarbeitung
- **DashboardService**: Report-Generierung und Formatierung
- **TodoistService**: Erweitert um Statistik-Methoden
- **NotionService**: Bestehende Integration für Projekt-/Lebensbereichs-Daten

### Caching & Performance
- Filter-basierte Abfragen für completed Tasks
- Parallele API-Calls für bessere Performance
- Graceful Error Handling bei API-Fehlern

### Error Handling
- Fehlende Todoist-Projekt-IDs werden ignoriert
- API-Fehler führen zu Default-Werten statt Crashes
- Logging aller wichtigen Operations

## 🔧 Konfiguration

### Umgebungsvariablen
```env
NOTION_API_KEY=your_notion_integration_key
TODOIST_API_KEY=your_todoist_api_token
NOTION_PROJECTS_DB=notion_projects_database_id
NOTION_LEBENSBEREICHE_DB=notion_lebensbereiche_database_id
```

### Notion-Datenbank Schema
**Projekte:**
- Name (Title)
- Status (Select: "Aktiv", "In Bearbeitung", etc.)
- Todoist Projekt (Rich Text)
- Lebensbereich (Relation zu Lebensbereiche DB)

**Lebensbereiche:**
- Name (Title) 
- Status (Select: "Aktiv", etc.)
- Todoist Projekt (Rich Text)

## 📋 Roadmap

### Geplante Features
- [ ] Historische Trend-Diagramme
- [ ] Slack/Discord Notifications für Weekly Reports
- [ ] Export zu Excel/PDF
- [ ] Predictive Analytics für Deadline-Risiken
- [ ] Team-Produktivitäts-Vergleiche

### Optimierungen
- [ ] Redis Caching für häufige Abfragen
- [ ] Scheduled Jobs für automatische Report-Generierung
- [ ] Real-time Updates via WebSockets
- [ ] Mobile-optimierte Dashboard-Ansicht

---

**Erstellt:** Januar 2025  
**Letzte Aktualisierung:** Siehe Git-History  
**Autor:** Life-Automations System