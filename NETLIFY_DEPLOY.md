# 🚀 Deploy su Netlify - Guida Completa

Questa guida ti aiuterà a deployare correttamente TruDelník Game su Netlify.

## 📋 Prerequisiti

1. Account Netlify
2. Repository GitHub/GitLab con il codice
3. Contratti deployati su Berachain e Coston2
4. Variabili d'ambiente configurate

## ⚙️ Configurazione Netlify

### 1. Impostazioni di Build

Quando crei il sito su Netlify, usa queste impostazioni:

```bash
# Build command
npm run build

# Publish directory  
frontend/dist

# Base directory
frontend
```

### 2. Variabili d'Ambiente

Vai su **Site settings > Environment variables** e aggiungi:

```bash
# Berachain Configuration
VITE_BERACHAIN_RPC_URL=https://rpc.berachain.com/
VITE_BERACHAIN_CHAIN_ID=80094
VITE_BERACHAIN_CONTRACT_ADDRESS=IL_TUO_INDIRIZZO_CONTRATTO_BERACHAIN
VITE_BERACHAIN_BLOCKSCOUT_URL=https://berascan.com
VITE_BERACHAIN_MERITS_API_URL=https://merits-staging.blockscout.com/api/v1

# Coston2 Configuration
VITE_COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_COSTON2_CHAIN_ID=114
VITE_COSTON2_CONTRACT_ADDRESS=IL_TUO_INDIRIZZO_CONTRATTO_COSTON2
VITE_COSTON2_BLOCKSCOUT_URL=https://coston2-explorer.flare.network
VITE_COSTON2_MERITS_API_URL=https://merits-staging.blockscout.com/api/v1

# Default Chain
VITE_DEFAULT_CHAIN=berachain

# API Keys
VITE_MERITS_API_KEY=LA_TUA_MERITS_API_KEY

# Akave Configuration
VITE_AKAVE_ACCESS_KEY_ID=LA_TUA_AKAVE_ACCESS_KEY
VITE_AKAVE_SECRET_ACCESS_KEY=LA_TUA_AKAVE_SECRET_KEY
VITE_AKAVE_BUCKET=trdelnik-game-data
VITE_AKAVE_ENDPOINT=https://akave.ai
```

## 📁 Struttura File

Assicurati che il repository abbia questa struttura:

```
trdelnik-game/
├── netlify.toml              ← Configurazione Netlify
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   └── dist/                 ← Generata dal build
└── contracts/
```

## 🔧 Configurazione netlify.toml

Il file `netlify.toml` nella root del progetto contiene:

```toml
[build]
  base = "frontend/"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🚨 Risoluzione Errori Comuni

### Errore: "Next.js plugin not found"
**Causa**: Netlify sta cercando di usare il plugin Next.js
**Soluzione**: Il file `netlify.toml` risolve questo problema specificando che è un'app Vite

### Errore: "Build command failed"
**Causa**: Dipendenze mancanti o variabili d'ambiente non configurate
**Soluzioni**:
1. Verifica che tutte le variabili d'ambiente siano configurate
2. Assicurati che il comando build sia `npm run build`
3. Verifica che la base directory sia `frontend/`

### Errore: "Assets not found"
**Causa**: Path degli assets non corretti
**Soluzione**: Il file `netlify.toml` configura i headers per `/assets/*`

### Errore: "Page not found on refresh"
**Causa**: SPA routing non configurato
**Soluzione**: Il redirect `/* → /index.html` nel `netlify.toml` risolve questo

## 🔄 Deploy Automatico

### Deploy da GitHub
1. Connetti il repository GitHub a Netlify
2. Configura le variabili d'ambiente
3. Ogni push su `main` triggerà un nuovo deploy

### Deploy Manuale
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build locale
cd frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## ✅ Verifiche Post-Deploy

Dopo il deploy, verifica:

1. **🌐 Chain Selector**: Funziona il cambio tra Berachain e Coston2?
2. **🔗 MetaMask**: Si connette correttamente?
3. **🎮 Game Functions**: Funzionano start game, play step, cashout?
4. **📊 Merits**: Si caricano correttamente i dati?
5. **💾 Akave**: Si salvano i dati delle partite?

## 🆘 Support

Se riscontri problemi:

1. Controlla i **logs di build** su Netlify
2. Verifica le **variabili d'ambiente**
3. Testa il **build locale** con `npm run build`
4. Controlla la **console del browser** per errori JavaScript

## 🎯 URL Demo

Una volta deployato, il tuo gioco sarà disponibile su:
`https://[nome-sito].netlify.app`

Condividi l'URL per far provare TruDelník Game! 🎉 