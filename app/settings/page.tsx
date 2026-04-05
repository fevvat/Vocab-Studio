'use client';

import { SectionCard } from '@/components/SectionCard';

export default function SettingsPage() {
  function handleExport(format: 'json' | 'csv') {
    window.open(`/api/export?format=${format}`, '_blank');
  }

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Ayarlar ve Veri Yönetimi</h1>
          <p>Uygulamadaki yerel verilerinizi buradan dışa aktarabilir ve Anki gibi aralıklı tekrar uygulamalarında kullanabilirsiniz.</p>
        </div>
      </div>

      <SectionCard title="Veri Yedekleme & Dışa Aktarma" description="Çalışma birimlerini ve zayıf kelimelerin istatistiklerini indir.">
        <div className="settings-grid">
          <div className="setting-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong>Tüm İlerlemeyi Yedekle (.json)</strong>
            <p>Sistemdeki tüm db dosyanı güvene al.</p>
            <button className="button" onClick={() => handleExport('json')}>JSON Olarak İndir</button>
          </div>
          <div className="setting-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong>Anki / Quizlet Kartları (.csv)</strong>
            <p>Zayıf kelimelerini ve performanslarını CSV olarak dışarı çıkar.</p>
            <button className="button button-primary" onClick={() => handleExport('csv')}>Anki CSV İndir</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Mevcut MVP ayarları" description="Bu alan gelişime açık bırakıldı">
        <div className="settings-grid">
          <div className="setting-card">
            <strong>Varsayılan zorluk</strong>
            <p>Orta</p>
          </div>
          <div className="setting-card">
            <strong>Varsayılan soru stili</strong>
            <p>Karışık</p>
          </div>
          <div className="setting-card">
            <strong>Varsayılan quiz modu</strong>
            <p>Karışık tekrar</p>
          </div>
          <div className="setting-card">
            <strong>Yakın Sürüm Notu</strong>
            <p>Auth sistemi (NextAuth) ve veritabanı migrate (Prisma) eklendiğinde bu ayarlar kalıcı hale getirilecek.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
