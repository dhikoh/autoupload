'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error | no_token
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(''); // '' | sending | sent | error

  useEffect(() => {
    if (!token) {
      setStatus('no_token');
      return;
    }

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email berhasil diverifikasi!');
          // Auto redirect to login after 3 seconds
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.detail || 'Link tidak valid atau sudah kadaluarsa.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Gagal terhubung ke server. Coba lagi.');
      });
  }, [token, router]);

  const handleResend = async () => {
    if (!resendEmail || resendStatus === 'sending') return;
    setResendStatus('sending');
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (res.ok) {
        setResendStatus('sent');
      } else {
        setResendStatus('error');
      }
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0533 50%, #0f0f1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Mail size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
            AutoPost Hub
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Verifikasi Email
          </p>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div style={{ color: '#94a3b8' }}>
            <Loader2 size={40} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p>Memverifikasi email Anda...</p>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              border: '2px solid rgba(16,185,129,0.3)',
            }}>
              <CheckCircle size={36} color="#10b981" />
            </div>
            <h2 style={{ color: '#10b981', fontSize: '20px', fontWeight: 700, marginBottom: 12 }}>
              Email Terverifikasi! 🎉
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: 24 }}>{message}</p>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 24 }}>
              Mengalihkan ke halaman login dalam 3 detik...
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Login Sekarang
            </button>
          </div>
        )}

        {/* Error state */}
        {(status === 'error' || status === 'no_token') && (
          <div>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              border: '2px solid rgba(239,68,68,0.3)',
            }}>
              <XCircle size={36} color="#ef4444" />
            </div>
            <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 700, marginBottom: 12 }}>
              {status === 'no_token' ? 'Link Tidak Valid' : 'Verifikasi Gagal'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: 28 }}>
              {status === 'no_token' ? 'Token tidak ditemukan di URL.' : message}
            </p>

            {/* Resend form */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'left',
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: 12, textAlign: 'center' }}>
                Minta kirim ulang link verifikasi:
              </p>
              <input
                type="email"
                placeholder="Email yang didaftarkan"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  marginBottom: 10,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleResend}
                disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                style={{
                  width: '100%',
                  background: resendStatus === 'sent'
                    ? 'rgba(16,185,129,0.2)'
                    : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: resendStatus === 'sending' || resendStatus === 'sent' ? 'not-allowed' : 'pointer',
                }}
              >
                {resendStatus === 'sending' ? 'Mengirim...'
                  : resendStatus === 'sent' ? '✓ Email Dikirim!'
                  : resendStatus === 'error' ? 'Gagal, Coba Lagi'
                  : 'Kirim Ulang'}
              </button>
            </div>

            <button
              onClick={() => router.push('/login')}
              style={{
                marginTop: 16,
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '11px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
