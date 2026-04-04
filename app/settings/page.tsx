import { SectionCard } from '@/components/SectionCard';

export default function SettingsPage() {
  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Ayarlar</h1>
          <p>Bu sürümde günlük hedef ve varsayılan çalışma alışkanlıkları veri katmanında hazır. Arayüz kalıcı ayar ekranına dönüştürülebilir.</p>
        </div>
      </div>

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
            <strong>Gelecek sürüm</strong>
            <p>Sesli telaffuz, flashcard, kullanıcı girişi, kalıcı ayar yönetimi</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
