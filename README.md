# Oxford Vocab Studio

Oxford 3000 çalışan öğrenciler için hazırlanmış, çoklu giriş destekli kelime çalışma platformu.

## Bu sürümde neler var?

- Görsel yükleme
- Tarayıcı içinde OCR (Tesseract.js)
- Manuel metin yapıştırarak kelime ekleme
- PDF yükleme desteği
- PDF metin çıkarma + gerektiğinde OCR fallback
- Ortak kelime temizleme ve doğrulama hattı
- Yerel Oxford seed veri seti entegrasyonu
- OCR sonrası review / edit ekranı
- Şüpheli kelime önerileri
- Çalışma birimi olarak kayıt
- Akıllı quiz üretimi
- Weak words sistemi
- Basit spaced repetition mantığı
- Dashboard ve Oxford ilerleme haritası
- Geçmiş ekranı

## Kullanılan yapı

- Next.js 16
- React 19
- TypeScript
- Tesseract.js
- pdfjs-dist
- Yerel JSON veri saklama (MVP için)

## Kurulum

```bash
npm install
npm run dev
```

Uygulama:
```bash
http://localhost:3000
```

## Ana akış

1. `/upload` sayfasına git
2. Görsel yükle, metin yapıştır veya PDF seç
3. Sistem kelimeleri çıkarıp review ekranına getirir
4. Şüpheli kelimeleri düzelt veya öneriyi uygula
5. Çalışma birimini kaydet
6. Birim sayfasında quiz modu ve soru stilini seç
7. Quiz çöz
8. Sonuçlar weak words ve dashboard'a işlenir

## Teknik notlar

- OCR istemci tarafında çalışır.
- Yerel veri seti `data/oxford3000.seed.json` dosyasındadır.
- Sözlük verisi önce yerel seed veriden gelir, eksik kalırsa dış API fallback denenir.
- Bu sürüm MVP olduğundan veriler `data/db.json` dosyasına yazılır.
- Seed veri seti tam Oxford 3000 kapsaması değildir; yapı hazırdır, veri seti genişletilebilir.

## Sonraki mantıklı geliştirmeler

- Kullanıcı girişi
- SQLite / Prisma geçişi
- Flashcard modu
- Sesli telaffuz
- Yazma egzersizleri
- AI ile mini okuma parçaları
- Kalıcı ayar yönetimi
