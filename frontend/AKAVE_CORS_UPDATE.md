# 🔧 Aggiornamento Policy CORS per Akave Bucket

Questa guida ti aiuterà ad aggiornare le policy CORS del bucket Akave per permettere l'accesso dal sito https://trudelnik.netlify.app

## 📋 Problema Risolto

**Errore CORS originale:**
```
Access to fetch at 'https://o3-rc1.akave.xyz/TruDelnik/game-5.json?x-id=GetObject' 
from origin 'https://trudelnik.netlify.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ⚙️ Configurazione CORS Aggiornata

Il file `cors.json` ora include:

✅ **Sviluppo Locale:**
- `http://localhost:8080`
- `http://127.0.0.1:8080`
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`

✅ **Produzione:**
- `https://trudelnik.netlify.app`

## 🚀 Come Aggiornare le Policy CORS su Akave

### 1. **Prerequisiti**
Assicurati di avere:
- AWS CLI installato e configurato
- Credenziali Akave configurate
- Accesso al bucket `TruDelnik`

### 2. **Installa AWS CLI** (se non già installato)
```bash
# macOS
brew install awscli

# Ubuntu/Debian  
sudo apt install awscli

# Windows
# Scarica da https://aws.amazon.com/cli/
```

### 3. **Configura Credenziali Akave**
```bash
aws configure --profile akave
# AWS Access Key ID: LA_TUA_AKAVE_ACCESS_KEY_ID
# AWS Secret Access Key: LA_TUA_AKAVE_SECRET_ACCESS_KEY  
# Default region name: us-east-1
# Default output format: json
```

### 4. **Visualizza Policy CORS Attuale**
```bash
aws s3api get-bucket-cors \
  --bucket TruDelnik \
  --endpoint-url https://o3-rc1.akave.xyz \
  --profile akave
```

### 5. **Aggiorna Policy CORS**
```bash
# Dalla directory frontend dove si trova cors.json
aws s3api put-bucket-cors \
  --bucket TruDelnik \
  --cors-configuration file://cors.json \
  --endpoint-url https://o3-rc1.akave.xyz \
  --profile akave
```

### 6. **Verifica Aggiornamento**
```bash
aws s3api get-bucket-cors \
  --bucket TruDelnik \
  --endpoint-url https://o3-rc1.akave.xyz \
  --profile akave
```

## ✅ Output Atteso

Dopo l'aggiornamento, dovresti vedere:

```json
{
  "CORSRules": [
    {
      "ID": "TruDelnikGameCORS",
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:8080",
        "http://127.0.0.1:8080", 
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://trudelnik.netlify.app"
      ],
      "ExposeHeaders": ["ETag", "x-amz-meta-*", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

## 🔍 Test delle Policy CORS

### Test da Console Browser (https://trudelnik.netlify.app):
```javascript
// Apri DevTools > Console e prova:
fetch('https://o3-rc1.akave.xyz/TruDelnik/game-1.json')
  .then(response => response.json())
  .then(data => console.log('CORS funziona!', data))
  .catch(error => console.error('CORS fallito:', error));
```

### Test da Locale (http://localhost:5173):
```javascript
// Stesso test dalla versione di sviluppo locale
fetch('https://o3-rc1.akave.xyz/TruDelnik/game-1.json')
  .then(response => response.json())
  .then(data => console.log('CORS locale funziona!', data))
  .catch(error => console.error('CORS locale fallito:', error));
```

## 🚨 Troubleshooting

### Errore: "Forbidden"
- Verifica che le credenziali Akave siano corrette
- Controlla che hai i permessi sul bucket `TruDelnik`

### Errore: "Bucket not found"  
- Verifica che il nome del bucket sia corretto (`TruDelnik`)
- Controlla l'endpoint URL Akave

### CORS ancora bloccato dopo aggiornamento
- Aspetta 1-2 minuti per la propagazione
- Svuota cache del browser
- Prova in modalità incognito

## 📚 Riferimenti

- [Akave CORS Documentation](https://docs.akave.xyz/akave-o3/cors/setting-cors-policies/)
- [AWS S3 CORS Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)

## 🎯 Risultato Finale

Dopo aver applicato queste modifiche:
- ✅ https://trudelnik.netlify.app potrà scaricare dati dal bucket Akave
- ✅ Sviluppo locale continuerà a funzionare
- ✅ Tutte le funzionalità del gioco funzioneranno correttamente 