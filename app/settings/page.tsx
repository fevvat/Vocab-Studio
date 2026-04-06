import { SectionCard } from '@/components/SectionCard';
import { SettingsForm } from '@/components/SettingsForm';
import { getSettings } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Ayarlar</h1>
          <p>Günlük hedefini ve varsayılan quiz tercihlerini kalıcı olarak kaydet.</p>
        </div>
      </div>

      <SectionCard title="Çalışma tercihleri" description="Bu tercihler yeni quiz oluştururken otomatik gelir">
        <SettingsForm initial={settings} />
      </SectionCard>
    </div>
  );
}
