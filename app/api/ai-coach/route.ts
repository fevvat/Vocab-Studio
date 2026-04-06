import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary, getQuizzes, getWeakWords } from '@/lib/server/db';

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

function buildFallbackReply(message: string, context: {
    dueTodayCount: number;
    weakWords: string[];
    latestAccuracy: number[];
    progressToGoal: number;
}) {
    const topWeak = context.weakWords.slice(0, 6);
    const recentAvg = context.latestAccuracy.length
        ? Math.round(context.latestAccuracy.reduce((sum, item) => sum + item, 0) / context.latestAccuracy.length)
        : 0;

    const asksPlan = /plan|program|routine|çalış|tekrar|study/i.test(message);
    const asksWeak = /weak|zayıf|hata|yanlış/i.test(message);

    if (asksWeak) {
        return [
            'Zayıf kelime odaklı hızlı öneri:',
            `- Bugün due olan kelime sayısı: ${context.dueTodayCount}`,
            `- Öncelikli tekrar listesi: ${topWeak.length ? topWeak.join(', ') : 'Henüz kritik kelime yok'}`,
            '- 10 dakikalık akış: 5 dk typed recall + 5 dk mixed review quiz',
            '- Her yanlış kelimeyi yeni bir cümle içinde yaz ve sesli tekrar et.',
        ].join('\n');
    }

    if (asksPlan) {
        return [
            'Sana özel mini çalışma planı:',
            `1) Hedef ilerlemen: %${context.progressToGoal}`,
            `2) Son quiz ortalaman: %${recentAvg}`,
            `3) İlk blok (8 dk): due weak kelimeler ${topWeak.length ? `(${topWeak.slice(0, 4).join(', ')})` : ''}`,
            '4) İkinci blok (10 dk): mixed_old_new quiz',
            '5) Son blok (5 dk): yanlış yaptığın 3 kelimeyle kısa cümle üretimi',
        ].join('\n');
    }

    return [
        'AI Coach (ücretsiz mod) yanıtı:',
        `- Bugün due tekrar: ${context.dueTodayCount}`,
        `- Son quiz trendi: %${recentAvg}`,
        `- Odak kelimeler: ${topWeak.length ? topWeak.join(', ') : 'Henüz zayıf kelime birikmedi'}`,
        '- İpucu: typed sorularda önce kısa cevap ver, sonra cümle içinde kullanarak pekiştir.',
    ].join('\n');
}

async function generateOpenRouterReply(prompt: string, contextText: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Oxford Vocab Studio',
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an English vocabulary study coach. Keep answers concise, practical, and personalized from the provided learner data. Prefer Turkish language in responses.',
                },
                {
                    role: 'user',
                    content: `Öğrenci verisi:\n${contextText}\n\nSoru: ${prompt}`,
                },
            ],
            temperature: 0.4,
        }),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
        return NextResponse.json({ message: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const [summary, dueWords, weakWords, quizzes] = await Promise.all([
        getDashboardSummary(),
        getWeakWords({ dueOnly: true }),
        getWeakWords(),
        getQuizzes(),
    ]);

    const latestAccuracy = quizzes
        .filter((quiz) => quiz.result)
        .slice(0, 5)
        .map((quiz) => quiz.result!.accuracy);

    const context = {
        dueTodayCount: summary.dueTodayCount,
        weakWords: weakWords.slice(0, 10).map((item) => item.word),
        latestAccuracy,
        progressToGoal: summary.progressToGoal,
    };

    const contextText = [
        `Günlük hedef ilerlemesi: %${summary.progressToGoal}`,
        `Bugün due tekrar sayısı: ${summary.dueTodayCount}`,
        `Top zayıf kelimeler: ${context.weakWords.join(', ') || 'yok'}`,
        `Son quiz doğrulukları: ${latestAccuracy.length ? latestAccuracy.join(', ') : 'yok'}`,
        `Streak: ${summary.streak}`,
        `Oxford coverage: %${summary.oxfordCoverage}`,
        `Due kelimeler: ${dueWords.slice(0, 12).map((item) => item.word).join(', ') || 'yok'}`,
    ].join('\n');

    const providerReply = await generateOpenRouterReply(message, contextText).catch(() => null);
    const fallbackReply = buildFallbackReply(message, context);

    return NextResponse.json({
        reply: providerReply || fallbackReply,
        source: providerReply ? 'openrouter' : 'local-fallback',
        context,
    });
}
