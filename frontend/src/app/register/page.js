'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false); // email verification required state

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Password tidak cocok');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, name, password);
      // If server requires email verification, show check-email state
      if (result && result.email_verification_required) {
        setEmailSent(true);
      }
      // Otherwise AuthContext already handled redirect
    } catch (err) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  }

  // Show check-email state
  if (emailSent) {
    return (
      <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '20px', padding: '48px 40px', maxWidth: '440px', width: '100%',
          textAlign: 'center', backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Mail size={32} color="#a78bfa" />
          </div>
          <h2 style={{ color: '#e2e8f0', fontSize: '22px', fontWeight: 700, marginBottom: 12 }}>
            Cek Email Anda!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: 24 }}>
            Link verifikasi telah dikirim ke <strong style={{ color: '#a78bfa' }}>{email}</strong>.<br />
            Klik link di email untuk mengaktifkan akun Anda.
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 24 }}>
            Tidak menerima email? Cek folder Spam atau{' '}
            <Link href="/verify-email" style={{ color: '#a78bfa' }}>minta kirim ulang</Link>.
          </p>
          <Link href="/login" style={{
            display: 'block', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', textDecoration: 'none', padding: '12px 32px',
            borderRadius: '10px', fontWeight: 600, fontSize: '15px',
          }}>
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left hide-mobile">
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-logo-icon"><Zap size={28} /></div>
          </div>
          <h1>Get Started</h1>
          <p>Join thousands of creators who save hours every day with AutoPost Hub.</p>
          <div className="auth-left-stats">
            <div className="auth-stat">
              <span className="auth-stat-num">10K+</span>
              <span className="auth-stat-label">Creators</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">1M+</span>
              <span className="auth-stat-label">Posts Delivered</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">6</span>
              <span className="auth-stat-label">Platforms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-mobile-logo hide-desktop">
            <div className="auth-logo-icon-sm"><Zap size={20} /></div>
            <span>AutoPost<span className="text-gradient">Hub</span></span>
          </div>

          <h2>Create Account</h2>
          <p className="auth-form-subtitle">Start your free account — no credit card required</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input type="text" className="input-field input-with-icon" placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input type="email" className="input-field input-with-icon" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input type="password" className="input-field input-with-icon" placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input type="password" className="input-field input-with-icon" placeholder="Re-enter password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign In</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; }
        .auth-left {
          flex: 1.2; position: relative; background: var(--bg-secondary);
          display: flex; align-items: center; justify-content: center;
          padding: var(--space-10); overflow: hidden;
        }
        .auth-left-glow {
          position: absolute; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .auth-left-content { position: relative; text-align: center; max-width: 400px; }
        .auth-left-logo { margin-bottom: var(--space-8); }
        .auth-logo-icon {
          width: 64px; height: 64px; margin: 0 auto; border-radius: var(--radius-xl);
          background: var(--gradient-primary); display: flex; align-items: center; justify-content: center;
          color: #fff; box-shadow: var(--shadow-glow); animation: glow 3s ease-in-out infinite;
        }
        .auth-left h1 { font-size: 2.5rem; margin-bottom: var(--space-4); }
        .auth-left p { color: var(--text-secondary); font-size: 1rem; line-height: 1.7; margin-bottom: var(--space-8); }
        .auth-left-stats { display: flex; justify-content: center; gap: var(--space-8); }
        .auth-stat { display: flex; flex-direction: column; gap: 2px; }
        .auth-stat-num {
          font-size: 1.5rem; font-weight: 800;
          background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .auth-stat-label { font-size: 0.75rem; color: var(--text-tertiary); }
        .auth-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: var(--space-10) var(--space-6);
        }
        .auth-form-container { width: 100%; max-width: 420px; }
        .auth-mobile-logo {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 1.125rem; font-weight: 800; margin-bottom: var(--space-8);
        }
        .auth-logo-icon-sm {
          width: 36px; height: 36px; border-radius: var(--radius-md);
          background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: #fff;
        }
        .auth-form-container h2 { font-size: 1.75rem; margin-bottom: var(--space-2); }
        .auth-form-subtitle { color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: var(--space-8); }
        .auth-form { display: flex; flex-direction: column; gap: var(--space-5); }
        .input-icon-wrapper { position: relative; }
        .input-icon-wrapper :global(.input-icon) {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text-tertiary); pointer-events: none;
        }
        .input-with-icon { padding-left: 40px !important; }
        .auth-error {
          padding: var(--space-3) var(--space-4); background: var(--error-bg);
          border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);
          color: var(--error-400); font-size: 0.8125rem; font-weight: 500;
        }
        .auth-switch {
          margin-top: var(--space-6); text-align: center;
          font-size: 0.875rem; color: var(--text-tertiary);
        }
        .auth-switch :global(a) { color: var(--primary-400); font-weight: 600; }
        @media (max-width: 768px) { .auth-right { padding: var(--space-6); } }
      `}</style>
    </div>
  );
}
