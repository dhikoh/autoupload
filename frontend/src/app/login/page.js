'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left hide-mobile">
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-logo-icon"><Zap size={28} /></div>
          </div>
          <h1>Welcome Back</h1>
          <p>Upload once, post everywhere. Your social media command center awaits.</p>
          <div className="auth-left-platforms">
            {['YouTube', 'Instagram', 'TikTok', 'Facebook', 'X', 'Threads'].map((p, i) => (
              <span key={i} className="auth-platform-pill">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-mobile-logo hide-desktop">
            <div className="auth-logo-icon-sm"><Zap size={20} /></div>
            <span>AutoPost<span className="text-gradient">Hub</span></span>
          </div>

          <h2>Sign In</h2>
          <p className="auth-form-subtitle">Enter your credentials to access your dashboard</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="input-field input-with-icon"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  className="input-field input-with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-form-options">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link href="/register">Sign Up</Link>
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
          background: radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .auth-left-content { position: relative; text-align: center; max-width: 400px; }
        .auth-left-logo { margin-bottom: var(--space-8); }
        .auth-logo-icon {
          width: 64px; height: 64px; margin: 0 auto;
          border-radius: var(--radius-xl); background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          color: #fff; box-shadow: var(--shadow-glow); animation: glow 3s ease-in-out infinite;
        }
        .auth-left h1 { font-size: 2.5rem; margin-bottom: var(--space-4); }
        .auth-left p { color: var(--text-secondary); font-size: 1rem; line-height: 1.7; margin-bottom: var(--space-8); }
        .auth-left-platforms { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); }
        .auth-platform-pill {
          padding: 4px 14px; background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);
        }
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
        .auth-form-options { display: flex; align-items: center; justify-content: space-between; }
        .auth-checkbox {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer;
        }
        .auth-checkbox input { accent-color: var(--primary-500); }
        .auth-forgot { font-size: 0.8125rem; color: var(--primary-400); transition: color var(--transition-fast); }
        .auth-forgot:hover { color: var(--primary-300); }
        .auth-error {
          padding: var(--space-3) var(--space-4); background: var(--error-bg);
          border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);
          color: var(--error-400); font-size: 0.8125rem; font-weight: 500;
        }
        .auth-switch {
          margin-top: var(--space-6); text-align: center;
          font-size: 0.875rem; color: var(--text-tertiary);
        }
        .auth-switch :global(a) { color: var(--primary-400); font-weight: 600; transition: color var(--transition-fast); }
        .auth-switch :global(a):hover { color: var(--primary-300); }
        @media (max-width: 768px) { .auth-right { padding: var(--space-6); } }
      `}</style>
    </div>
  );
}
