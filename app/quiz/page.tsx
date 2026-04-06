import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getQuizzes, getStudyUnits } from '@/lib/server/db';
import { formatDate, titleForQuestionStyle, titleForQuizMode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function QuizHubPage() {
    const [units, quizzes] = await Promise.all([getStudyUnits(), getQuizzes()]);
    const pendingQuizzes = quizzes.filter((quiz) => !quiz.result);
    const solvedQuizzes = quizzes.filter((quiz) => quiz.result);

    return (
        <div className="stack-xl">
            <section className="hero-card">
                <div className="stack-sm">
                    <div className="eyebrow">Quiz Lab</div>
                    <h1>Quiz üretim ve çözüm merkezi</h1>
                    <p>
                        Bu hub tüm quiz operasyonunu tek yerde toplar: setten üret, bekleyenleri tamamla, sonuçları tekrar aç.
                    </p>
                    <div className="actions-row">
                        <Link href="/upload" className="button">Yeni set ekle</Link>
                        <Link href="/weak-words" className="button">Recovery</Link>
                        <Link href="/ai-coach" className="button button-primary">Coach ile planla</Link>
                    </div>
                    <div className="chip-row">
                        <span className="chip">Set: {units.length}</span>
                        <span className="chip">Bekleyen: {pendingQuizzes.length}</span>
                        <span className="chip">Tamamlanan: {solvedQuizzes.length}</span>
                    </div>
                </div>

                <div className="hero-panel">
                    <div className="hero-metric"><strong>{quizzes.length}</strong><span>Toplam quiz</span></div>
                    <div className="hero-metric"><strong>{pendingQuizzes.length}</strong><span>Çözülmeyi bekleyen</span></div>
                    <div className="hero-metric"><strong>{solvedQuizzes.length}</strong><span>Çözülmüş quiz</span></div>
                </div>
            </section>

            <div className="grid-2">
                <SectionCard title="Set seçerek quiz üret" description="Birimi aç ve QuizBuilder ile anında test oluştur">
                    {units.length ? (
                        <div className="list-stack">
                            {units.map((unit) => (
                                <Link key={unit.id} href={`/study-units/${unit.id}`} className="list-card">
                                    <div>
                                        <strong>{unit.title}</strong>
                                        <p>{unit.wordCount} kelime • {unit.inputMethod} • {formatDate(unit.createdAt)}</p>
                                    </div>
                                    <span>Üret →</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="Quiz için set bulunamadı" description="Önce kelime seti içe aktar, sonra quiz üret." ctaHref="/upload" ctaLabel="Set yükle" />
                    )}
                </SectionCard>

                <SectionCard title="Bekleyen quizler" description="Tamamlanmamış testlere hızlı devam">
                    {pendingQuizzes.length ? (
                        <div className="list-stack">
                            {pendingQuizzes.slice(0, 12).map((quiz) => (
                                <Link key={quiz.id} href={`/quiz/${quiz.id}`} className="list-card">
                                    <div>
                                        <strong>{quiz.questionCount} soruluk quiz</strong>
                                        <p>{titleForQuestionStyle(quiz.style)} • {titleForQuizMode(quiz.mode)} • {quiz.difficulty}</p>
                                    </div>
                                    <span className="chip">Devam et</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="Bekleyen quiz yok" description="Yeni quiz ürettiğinde bu alan aktif olur." />
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Tamamlanan quiz sonuçları" description="Geçmiş sonuçları açıp zayıf alanları izle">
                {solvedQuizzes.length ? (
                    <div className="list-stack">
                        {solvedQuizzes.slice(0, 16).map((quiz) => (
                            <Link key={quiz.id} href={`/results/${quiz.id}`} className="list-card">
                                <div>
                                    <strong>{quiz.questionCount} soruluk quiz</strong>
                                    <p>{titleForQuestionStyle(quiz.style)} • {titleForQuizMode(quiz.mode)} • {formatDate(quiz.createdAt)}</p>
                                </div>
                                <span className="badge-success">%{quiz.result?.accuracy ?? 0}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Sonuçlanan quiz yok" description="İlk quiz çözümünden sonra skorlar burada listelenir." />
                )}
            </SectionCard>
        </div>
    );
}
