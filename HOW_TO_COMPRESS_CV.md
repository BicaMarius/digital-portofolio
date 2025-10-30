# Cum să comprimi CV-ul pentru upload

## Problema
CV-ul tău este prea mare (peste 2MB) pentru a fi salvat în baza de date.

## Soluție Rapidă: Compresie PDF Online

### Opțiunea 1: PDF24 Tools (Recomandat)
1. Mergi pe https://tools.pdf24.org/ro/comprima-pdf
2. Upload-ul PDF-ul tău
3. Alege "Compresie puternică" (Strong compression)
4. Descarcă PDF-ul comprimat
5. Upload-ul pe site

### Opțiunea 2: iLovePDF
1. Mergi pe https://www.ilovepdf.com/compress_pdf
2. Upload-ul PDF-ul
3. Click "Compress PDF"
4. Descarcă rezultatul

### Opțiunea 3: SmallPDF
1. Mergi pe https://smallpdf.com/compress-pdf
2. Upload-ul fișierul
3. Alege "Basic compression" (free)
4. Descarcă

## Alte Metode

### Reducerea calității imaginilor (dacă CV-ul are poze)
- Folosește Adobe Acrobat: File > Save As Other > Reduced Size PDF
- Canva: Export ca PDF cu calitate "Standard" în loc de "High"

### Eliminarea elementelor neesențiale
- Șterge imagini decorative mari
- Reduce rezoluția pozelor (max 300 DPI pentru print, 150 DPI pentru web)
- Folosește fonturi standard (nu embedded fonts)

## Limite Tehnice

| Limită | Valoare | Motiv |
|--------|---------|-------|
| Mărime max | 2MB | Limita bazei de date Neon + Vercel serverless |
| Format | PDF doar | Pentru securitate și compatibilitate |

## Dimensiuni Tipice CV

| Tip CV | Mărime tipică | Status |
|--------|---------------|--------|
| Text simplu | 50-200 KB | ✅ Perfect |
| Cu o poză | 200-500 KB | ✅ OK |
| Design complex | 500KB-1MB | ⚠️ Acceptabil |
| Multe imagini | 1-3 MB | ❌ Prea mare |
| Scanat high-res | 3-10 MB | ❌ Trebuie comprimat |

## Tips pentru Viitor

✅ Creează CV-ul direct ca PDF (nu scana)
✅ Folosește o singură poză (max 200KB)
✅ Evită background-uri complexe
✅ Folosește vectori în loc de raster images
✅ Export din Canva/Word la "Standard quality"

❌ Nu scana la 300+ DPI
❌ Nu include multiple imagini high-res
❌ Nu folosi background images mari

## Verificare Mărime

### Windows
- Click dreapta pe fișier → Properties → General tab → Size

### Online
- https://pdfcandy.com/pdf-file-size.html

## Support

Dacă după compresie CV-ul încă e peste 2MB, consideră:
1. Împarte-l în 2 pagini (păstrează doar prima)
2. Recreează-l fără imagini decorative
3. Folosește un template mai simplu

---

**Notă**: Limita de 2MB e suficientă pentru 95% din CV-urile text + poză. Dacă CV-ul tău e un portfolio grafic cu multe imagini, consideră să încărci doar versiunea text pe site și să menționezi un link către portfolio complet.
