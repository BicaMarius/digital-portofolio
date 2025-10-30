# CV Storage Migration - Neon Only

## Ce s-a schimbat?

Am migrat complet storage-ul CV de la Supabase la **Neon PostgreSQL Database**.

### Înainte (cu Supabase):
- CV-urile erau salvate în Supabase Storage
- Necesita configurare separată (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, bucket)
- Schema: `file_name`, `file_url`, `storage_path`

### Acum (cu Neon):
- CV-urile sunt salvate **direct în baza de date Neon** ca text base64
- Folosim doar `DATABASE_URL` (deja configurată)
- Schema nouă: `file_name`, `file_data`, `mime_type`
- Limită: 10MB per CV (suficient pentru majoritatea CV-urilor PDF)

## Fișiere Modificate

### 1. Schema (`shared/schema.ts`)
```typescript
export const cvData = pgTable("cv_data", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded PDF
  mimeType: text("mime_type").notNull().default('application/pdf'),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
```

### 2. API Route (`api/cv.ts`)
- Eliminat toate referințele la Supabase
- Upload-ul convertește PDF-ul în base64 și îl salvează în DB
- GET returnează data URL: `data:application/pdf;base64,<base64data>`
- DELETE șterge pur și simplu înregistrarea din DB

### 3. Server Routes (`server/routes.ts`)
- Eliminat import-ul `supabase.ts`
- Adaptat logica POST/GET/DELETE pentru noua schemă
- Adăugat validare: max 10MB

### 4. Fișiere Șterse
- `server/supabase.ts` - nu mai este necesar
- `SETUP_CV.md` - documentație Supabase
- `check-cv-config.js` - script de verificare Supabase

## Configurare

### Local Development
Doar ai nevoie de `DATABASE_URL` în `.env`:
```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### Vercel Deployment
1. Asigură-te că `DATABASE_URL` este setată în **Environment Variables**
2. Deploy - gata!

**NOTĂ**: Nu mai ai nevoie de variabilele `SUPABASE_*`. Le poți șterge din Vercel.

## Avantaje

✅ **Mai simplu**: O singură configurare (DATABASE_URL)
✅ **Mai ieftin**: Fără costuri suplimentare pentru storage
✅ **Mai rapid**: Fără apeluri HTTP externe (totul în DB)
✅ **Atomic**: Ștergerea înregistrării șterge și fișierul
✅ **Backup automat**: CV-urile sunt incluse în backup-urile DB

## Dezavantaje / Limitări

⚠️ **Limită de mărime**: 10MB per CV (vs nelimitat pe Supabase)
⚠️ **Lățime de bandă DB**: Transferul de date consumă din conexiunile DB
⚠️ **Nu e ideal pentru multe fișiere**: Dacă vei avea multe fișiere mari, consideră să revii la storage dedicat

## Testing

### Test Local:
```bash
npm run dev
# Deschide http://localhost:5000/profile
# Mergi la tab-ul CV și testează upload/delete
```

### Test API Direct:
```bash
# GET CV
curl http://localhost:5000/api/cv

# POST CV (înlocuiește path-ul cu un PDF real)
curl -X POST -F "file=@/path/to/cv.pdf" http://localhost:5000/api/cv

# DELETE CV
curl -X DELETE http://localhost:5000/api/cv
```

## Migrarea Datelor Existente

Dacă ai deja CV-uri în Supabase Storage și vrei să le migrezi:

1. Descarcă CV-ul din Supabase
2. Upload-ul din nou prin interfața UI
3. Noul sistem va înlocui automat

Sau folosește acest script:
```javascript
// migrate-cv-from-supabase.js
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function migrate() {
  // 1. Descarcă din Supabase
  const oldCvUrl = 'https://your-project.supabase.co/storage/v1/object/public/...';
  const pdfBuffer = await fetch(oldCvUrl).then(r => r.buffer());
  
  // 2. Upload în noul sistem
  const form = new FormData();
  form.append('file', pdfBuffer, 'cv.pdf');
  
  await fetch('http://localhost:5000/api/cv', {
    method: 'POST',
    body: form
  });
  
  console.log('✅ CV migrat cu succes!');
}

migrate();
```

## Revenirea la Supabase (dacă e necesar)

Dacă mai târziu decizi să revii la Supabase:
1. Reinstalează `@supabase/supabase-js`
2. Restabilește `server/supabase.ts` din Git history
3. Revert schema la versiunea veche
4. Rulează migrație pentru datele existente

## Support

Pentru probleme:
- Verifică că `DATABASE_URL` e setată corect
- Verifică că PDF-ul e sub 10MB
- Vezi console-ul pentru log-uri `[CV API]`
- Verifică Vercel Function Logs pentru erori production

## Status

✅ **Implementat și testat** - Ready for production!
