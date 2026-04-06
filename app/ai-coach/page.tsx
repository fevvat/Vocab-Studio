import Link from 'next/link';
import { AICoachPanel } from '@/components/AICoachPanel';
import { SectionCard } from '@/components/SectionCard';
import { getDashboardSummary, getWeakWords } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function AICoachPage() {
    const [summary, dueWords] = await Promise.all([
        getDashboardSummary(),
        getWeakWords({ dueOnly: true }),
    ]);

    return (
        <div className="stack-xl">
            <section className="hero-card">
                <div className="stack-sm">
                    <div className="eyebrow">Coach Console</div>
                    <h1>AI ile kişisel çalışma planı</h1>
                    <p>
                        Coach, quiz performansı, weak-word kuyruğu ve günlük hedef verisini kullanarak kısa aksiyon planı üretir.
                    </p>
                    <div className="actions-row">
                        <Link href="/quiz" className="button button-primary">Quiz Lab</Link>
                        <Link href="/dashboard" className="button">Insights</Link>
                        <Link href="/weak-words" className="button">Recovery</Link>
                    </div>
                    <div className="chip-row">
                        <span className="chip">Progress %{summary.progressToGoal}</span>
                        <span className="chip">Due {summary.dueTodayCount}</span>
                        <span className="chip">Streak {summary.streak} gün</span>
                    </div>
                </div>

                <div className="hero-panel">
                    <div className="hero-metric"><strong>{dueWords.length}</strong><span>Bugün hazır tekrar</span></div>
                    <div className="hero-metric"><strong>%{summary.averageAccuracy}</strong><span>Quiz doğruluk ort.</span></div>
                    <div className="hero-metric"><strong>%{summary.oxfordCoverage}</strong><span>Oxford coverage</span></div>
                </div>
            </section>

            <SectionCard
                title="Coach çalışma mantığı"
                description="OpenRouter API varsa canlı model, yoksa uygulama içi ücretsiz fallback yanıtı kullanılır."
            >
                <div className="chip-row large-gap">
                    <span className="chip">Trend odaklı öneri</span>
                    <span className="chip">Weak-word önceliklendirme</span>
                    <span className="chip">Daily-goal takibi</span>
                    <span className="chip">Fallback güvenliği</span>
                </div>
            </SectionCard>

            <AICoachPanel />
        </div>
    );
}
