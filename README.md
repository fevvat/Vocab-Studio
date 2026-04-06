# Oxford Vocab Studio

Oxford 3000 odaklı, görsel + manuel metin + PDF girişini aynı öğrenme hattında birleştiren kelime çalışma uygulaması.

## Neler var?
- Baştan tasarlanmış yeni arayüz (Workspace + Quiz Lab + Insights düzeni)
- Yeni Quiz sekmesi (`/quiz`) ile merkezi quiz yönetimi
- Başlangıçta temiz DB + 3000 kelimelik Oxford seed çalışma birimi
- Görsel OCR ile kelime çıkarma
- Manuel metin yapıştırma / yazma
- PDF yükleme (metin tabanlı + OCR fallback)
- Ortak candidate / review akışı
- Quiz üretimi (mixed, weak only, review, new only, mixed_old_new)
- Açık uçlu yazma soruları: TR → EN (yazarak), EN → TR (yazarak), boşluk doldurma (yazarak)
- Hibrit quiz oynatıcı (çoktan seçmeli + yazmalı soru tipleri)
- Cevap süresi + güven puanı toplayan adaptif değerlendirme
- Geliştirilmiş weak-word algoritması (hız ve güven sinyali ile)
- Quiz sonrası kişisel günlük çalışma planı (due weak + pekiştirme + yeni kelimeler)
- Oxford ilerleme haritası
- Kalıcı ayarlar ekranı
- Kritik API endpoint’lerinde girdi doğrulama katmanı
- Ücretsiz AI Coach ekranı (OpenRouter free model + local fallback)
- AI önerilerinde weak words / quiz doğruluğu / günlük hedef verisi kullanımı
- Opsiyonel Supabase storage desteği

## Kurulum
```bash
npm install
npm run dev
```

## Çalıştırma
Tarayıcıda aç:
```text
http://localhost:3000
```

## Varsayılan veri saklama
Bu proje yerelde `data/db.json` dosyasını kullanır.

İlk açılış/veri sıfırlama senaryosu için DB başlangıcı:
- `studyUnits`: 1 adet seed birim (Oxford 3000 Master Seed)
- seed birim içeriği: 3000 kelime
- `quizzes`, `weakWords`: boş

## Opsiyonel canlı veri saklama (Supabase)
Vercel gibi ortamlarda kalıcı veri için `.env.local` içine şunları ekleyebilirsin:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STATE_TABLE=app_state
```

Ardından Supabase tarafında şu tabloyu aç:

```sql
create table if not exists app_state (
  id integer primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_state (id, data)
values (
  1,
  '{
    "studyUnits": [],
    "quizzes": [],
    "settings": {
      "dailyGoal": 100,
      "preferredDifficulty": "medium",
      "preferredQuestionStyle": "mixed",
      "preferredQuizMode": "mixed"
    },
    "weakWords": [],
    "activityLog": []
  }'::jsonb
)
on conflict (id) do nothing;
```

## Ücretsiz AI Coach (OpenRouter)
`/ai-coach` ekranı, çalışma verilerini kullanarak kişisel öneri üretir:
- due weak words
- son quiz doğruluk trendi
- günlük hedef ilerlemesi

OpenRouter kullanmak için `.env.local` içine şunları ekle:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Not: `OPENROUTER_API_KEY` yoksa sistem otomatik olarak yerel ücretsiz fallback öneri moduna geçer.

## Yeni navigasyon
- `/`: Workspace (günlük rota + hızlı erişim)
- `/quiz`: Quiz Lab (üretim, bekleyenler, sonuçlananlar)
- `/dashboard`: Insights (hedef ve performans radarı)
- `/weak-words`: Recovery (due ve riskli kelime listesi)
- `/ai-coach`: Coach Console (ücretsiz AI destekli plan önerisi)

## Yararlı komutlar
```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Not
Bu sürüm yerel Oxford seed veri seti ile gelir ve başlangıç DB'si 3000 kelimelik seed birimle başlatılmıştır. Oxford dışı eklenen kelimeler de quiz ve review akışında çalışır; sadece ilerleme haritasında ayrı sayılır.

Yeni açık uçlu soru tiplerinde değerlendirme normalize edilmiş metin eşleşmesi ile yapılır (büyük/küçük harf ve bazı noktalama farkları tolere edilir).
