# ScreenSmart AI OS — Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo`
- A Supabase project (free tier works)
- (Optional) Ollama for local AI

## 1. Clone and install

```bash
git clone https://github.com/Expressmovers2024/screensmart-ai.git
cd screensmart-ai
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key.

## 3. Deploy the AI proxy

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the edge function
supabase functions deploy ai-proxy

# Set secrets
supabase secrets set OPENROUTER_API_KEY=sk-or-YOUR_KEY
supabase secrets set APP_URL=https://your-app.com
supabase secrets set APP_ALLOWED_ORIGINS=https://your-app.com,exp://localhost:8081
```

## 4. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator.

## 5. (Optional) Set up local AI

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.1:8b`
3. In the app: Settings → Set up Local AI → Check connection
4. Set `EXPO_PUBLIC_OLLAMA_URL=http://YOUR_LAN_IP:11434` if running on a physical phone

## Developer workflow

```bash
# Type check
npm run typecheck

# Apply an AI patch
make apply PATCH=~/Downloads/patch.zip

# Start new feature branch
make session NAME=my-feature

# Export Android bundle
npx expo export --platform android --output-dir dist/android
```
