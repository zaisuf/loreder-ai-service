# loreder-ai-service

**Loreder AI** is a high-performance AI Aggregator and Gateway built on **Next.js App Router**. It provides an OpenAI-compatible `/v1` endpoint pre-configured with **OpenCode Zen free models**, API Key management, live streaming (SSE), and a modern Web UI Dashboard.

---

## ⚡ Features

- **OpenAI Standard Gateway (`/v1`)**:
  - `POST /v1/chat/completions`: Full support for streaming (`text/event-stream`) and standard JSON outputs.
  - `GET /v1/models`: Returns list of active models with context length and pricing metadata.
- **OpenCode Zen Provider Integration**:
  - Pre-configured with OpenCode Zen base URL (`https://opencode.ai/zen/v1`).
  - Supports 62+ OpenCode Zen models including free tier models (`deepseek-v4-flash-free`, `mimo-v2.5-free`, `nemotron-3.5-lightning-free`, `hy3-free`, `laguna-s-2.1-free`).
  - Strict model fidelity routing.
- **Modern Next.js Dashboard (`http://localhost:3000`)**:
  - **Interactive Playground**: Test models in real-time with system prompts, temperature sliders, and live streaming output.
  - **Analytics Overview**: Real-time request volume, token counters, latencies, and usage distribution charts.
  - **API Key Management**: Generate, copy, and manage custom API keys (`sk-loreder-...`).
  - **Model Catalog**: Explore and register custom models.
  - **Provider Settings**: Configure upstream base URLs and credentials.
  - **Developer Docs**: Ready-to-copy code snippets for Python (OpenAI SDK), Node.js, cURL, and Cursor/VS Code.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. OpenAI Compatible API Usage (cURL)
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-loreder-your-generated-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "opencode/deepseek-v4-flash-free",
    "messages": [{"role": "user", "content": "Hello from OpenCode Zen!"}],
    "stream": true
  }'
```

### 4. Deploy to Vercel
```bash
npx vercel
```
Set environment variable `OPENCODE_API_KEY` in Vercel settings if desired.

---

## 📄 License
ISC License
