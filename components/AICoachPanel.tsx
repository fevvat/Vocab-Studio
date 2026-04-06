'use client';

import { useState } from 'react';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

const starterPrompts = [
    'Bugün için 20 dakikalık çalışma planı ver.',
    'Zayıf kelimelerime göre quiz stratejisi öner.',
    'Yanlış yaptığım kelimeleri nasıl kalıcı öğrenirim?',
];

export function AICoachPanel() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Merhaba! Öğrenme verine göre kişisel plan, weak-word odaklı tekrar ve quiz stratejileri önerebilirim.',
        },
    ]);

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const nextUserMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: trimmed,
        };

        setMessages((prev) => [...prev, nextUserMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/ai-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed }),
            });

            if (!response.ok) throw new Error('AI Coach isteği başarısız');

            const data = await response.json() as { reply?: string; source?: string };
            const sourceLabel = data.source === 'openrouter' ? 'AI provider' : 'Yerel ücretsiz fallback';

            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `${data.reply || 'Şu an yanıt üretilemedi.'}\n\nKaynak: ${sourceLabel}`,
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: 'AI Coach şu anda yanıt veremedi. Birkaç saniye sonra tekrar dene.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="stack-xl">
            <div className="section-card">
                <div className="section-head">
                    <div>
                        <h2>Hızlı komutlar</h2>
                        <p>Tek tıkla kişisel öneri üret.</p>
                    </div>
                </div>
                <div className="chip-row large-gap">
                    {starterPrompts.map((prompt) => (
                        <button key={prompt} type="button" className="button" onClick={() => sendMessage(prompt)} disabled={loading}>
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <section className="section-card ai-chat-shell">
                <div className="ai-chat-list">
                    {messages.map((message) => (
                        <article key={message.id} className={`ai-bubble ${message.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}`}>
                            <strong>{message.role === 'user' ? 'Sen' : 'AI Coach'}</strong>
                            <p>{message.content}</p>
                        </article>
                    ))}
                </div>

                <form
                    className="ai-chat-form"
                    onSubmit={(e: any) => {
                        e.preventDefault();
                        sendMessage(input);
                    }}
                >
                    <textarea
                        className="textarea textarea-small"
                        value={input}
                        onChange={(e: any) => setInput(e.target.value)}
                        placeholder="Örn: Son iki quiz sonucuma göre bugün ne çalışmalıyım?"
                    />
                    <button type="submit" className="button button-primary" disabled={loading || !input.trim()}>
                        {loading ? 'Yanıt hazırlanıyor...' : 'AI Coach’a sor'}
                    </button>
                </form>
            </section>
        </div>
    );
}
