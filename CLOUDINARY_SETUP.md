# Cloudinary Setup pentru Vercel

## ✅ Ce am făcut:

1. **Migrat storage-ul de la Neon → Cloudinary**
   - CV-uri sunt acum stocate în Cloudinary (până la 10MB)
   - Doar metadata (nume, URL, ID) rămâne în Neon
   - Suport pentru 25GB storage + bandwidth pe planul gratuit

2. **Actualizat schema bazei de date**
   - `file_url` - URL-ul Cloudinary
   - `cloudinary_public_id` - pentru ștergere
   - Eliminat `file_data` (nu mai stocăm base64)

## 🔧 Setup Vercel Environment Variables

Mergi în **Vercel Dashboard** → **Settings** → **Environment Variables** și adaugă:

### Variabilă 1: CLOUDINARY_URL (Recomandată)
```
Name: CLOUDINARY_URL
Value: cloudinary://333793169334168:0LY_-em6x9FOIFfc4dmzxQDbb2k@dzs53qwvz
Environment: Production, Preview, Development (toate 3)
```

### SAU variabilele individuale:

```
CLOUDINARY_CLOUD_NAME=dzs53qwvz
CLOUDINARY_API_KEY=333793169334168
CLOUDINARY_API_SECRET=0LY_-em6x9FOIFfc4dmzxQDbb2k
```

## 📋 Checklist Deployment:

- [x] Cloudinary SDK instalat (`npm install cloudinary`)
- [x] Helper `server/cloudinary.ts` creat
- [x] Schema actualizată în `shared/schema.ts`
- [x] API route `api/cv.ts` actualizat
- [x] Server routes `server/routes.ts` actualizat
- [x] Frontend limit crescut la 10MB
- [x] **Adaugă variabilele în Vercel** ⚠️
- [x] Redeploy după ce ai adăugat variabilele
- [x] Testează upload CV

## 🧪 Test Local:

```bash
# Serverul deja rulează
# Deschide: http://localhost:5000/profile
# Încearcă să încarci un CV (până la 10MB)
```

## 📊 Cloudinary Dashboard:

**Link**: https://console.cloudinary.com/console/c-38284aecd7d6914738f7a65972a09/media_library/folders/home

Aici vei vedea toate fișierele încărcate în folderul `portfolio-cv/`.

## 🎯 Beneficii:

✅ **10MB limit** (în loc de 2MB)
✅ **25GB storage gratuit** (în loc de limită DB)
✅ **CDN global** - încărcare rapidă oriunde
✅ **Optimizare automată** - compresie inteligentă
✅ **Transformări on-the-fly** - resize, crop, etc.

## ⚠️ Important:

După ce adaugi variabilele în Vercel, **așteaptă 1-2 minute** pentru redeploy automat sau:
1. Mergi la **Deployments** tab
2. Click pe `...` lângă ultimul deployment
3. Click **Redeploy**

## 🐛 Debugging:

Dacă vezi erori 500, verifică în **Vercel Function Logs**:
- `[Cloudinary] Initialized with cloud: dzs53qwvz` ✅
- `[Cloudinary] Upload successful: portfolio-cv/...` ✅
- `[CV API] Upload successful, CV stored in Cloudinary` ✅

## 📝 Next Steps:

După ce CV-urile merg, vom migra și **imaginile gallery** pe Cloudinary pentru același beneficii! 🚀
