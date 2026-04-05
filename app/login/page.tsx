'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [username, setUsername] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3) {
      alert('Kullanıcı adı en az 3 karakter olmalı');
      return;
    }
    // Session cookie'sini 365 günlük olarak kaydet
    Cookies.set('vocab-user-session', username.trim().toLowerCase(), { expires: 365 });
    window.location.href = '/';
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="section-card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>Giriş Yap</h1>
        <p className="muted" style={{ marginBottom: '20px' }}>
          Çalışmalarının senin adına kaydedilmesi için bir kullanıcı adı belirle. Her kullanıcı adı için ayrı ve gizli bir veritabanı oluşturulur.
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="Örn: ahmet_oxford"
          />
          <button type="submit" className="button button-primary">Çalışmaya Başla</button>
        </form>
      </div>
    </div>
  );
}
