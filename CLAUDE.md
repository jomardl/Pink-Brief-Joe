# P&G Pink Brief Architect

## Project Overview
- **Type**: AI-powered creative brief generation tool for P&G
- **Stack**: React 19 + TypeScript + Vite
- **AI Integration**: Google Gemini (`@google/genai`)

## Tech Stack
- **Framework**: React 19.2.3
- **Build**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **UI**: Framer Motion (animations), Lucide React (icons)
- **Styling**: Tailwind CSS (inline classes)

## Commands
```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Variables
- `GEMINI_API_KEY` - Required for AI features (set in `.env` or `.env.local`)

## Project Structure
```
├── App.tsx                 # Main app component with module navigation
├── index.tsx               # Entry point
├── types.ts                # TypeScript type definitions
├── geminiService.ts        # Gemini AI service integration
├── components/
│   ├── ResearchModule.tsx      # Step 1: Upload research/verbatims
│   ├── InsightsModule.tsx      # Step 2: Extract insights
│   ├── StrategyModule.tsx      # Step 3: Deep dive strategy
│   └── SummaryModule.tsx       # Step 4: Final PINK BRIEF output
```

## App Flow
1. **Upload** - Import consumer verbatims and research reports
2. **Insights** - AI synthesizes data into actionable human truths
3. **Deep Dive** - Internal narrative justifying strategic "Right to Win"
4. **PINK BRIEF** - Generate final standardized P&G brief

## MCP Server Setup
Playwright MCP configured in `.mcp.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```
**After changing `.mcp.json`**: Reload VSCode window (`Cmd+Shift+P` → "Developer: Reload Window")

---

## Changes Log

### 2026-01-28
- Created CLAUDE.md for project context
- Added `.mcp.json` with Playwright MCP server configuration

---

## Notes
- Path alias `@/` points to project root
- The app uses a multi-step wizard pattern with state managed in App.tsx
- Each module receives `briefData` and updates it via `onNext` callback
- **Git**: Do not push to remote unless explicitly told to
