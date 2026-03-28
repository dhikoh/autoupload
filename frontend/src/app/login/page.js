'use client';
import Link from 'next/link';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="auth-page">
      {/* Left side — branding */}
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

      {/* Right side — form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-mobile-logo hide-desktop">
            <div className="auth-logo-icon-sm"><Zap size={20} /></div>
            <span>AutoPost<span className="text-gradient">Hub</span></span>
          </div>

          <h2>Sign In</h2>
          <p className="auth-form-subtitle">Enter your credentials to access your dashboard</p>

          <form className="auth-form" onSubmit={e => e.preventDefault()}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input type="email" className="input-field input-with-icon" placeholder="you@example.com" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input type="password" className="input-field input-with-icon" placeholder="••••••••" />
              </div>
            </div>

            <div className="auth-form-options">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full">
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="btn btn-secondary btn-lg w-full auth-google-btn">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>

          <p className="auth-switch">
            Don't have an account? <Link href="/register">Sign Up</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
        }

        /* Left branding */
        .auth-left {
          flex: 1.2;
          position: relative;
          background: var(--bg-secondary);
          display: flex; align-items: center; justify-content: center;
          padding: var(--space-10);
          overflow: hidden;
        }
        .auth-left-glow {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        .auth-left-content {
          position: relative; text-align: center; max-width: 400px;
        }
        .auth-left-logo { margin-bottom: var(--space-8); }
        .auth-logo-icon {
          width: 64px; height: 64px; margin: 0 auto;
          border-radius: var(--radius-xl);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: var(--shadow-glow);
          animation: glow 3s ease-in-out infinite;
        }
        .auth-left h1 {
          font-size: 2.5rem; margin-bottom: var(--space-4);
        }
        .auth-left p {
          color: var(--text-secondary); font-size: 1rem; line-height: 1.7;
          margin-bottom: var(--space-8);
        }
        .auth-left-platforms {
          display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2);
        }
        .auth-platform-pill {
          padding: 4px 14px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          font-size: 0.75rem; font-weight: 500;
          color: var(--text-secondary);
        }

        /* Right form */
        .auth-right {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: var(--space-10) var(--space-6);
        }
        .auth-form-container {
          width: 100%; max-width: 420px;
        }
        .auth-mobile-logo {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 1.125rem; font-weight: 800;
          margin-bottom: var(--space-8);
        }
        .auth-logo-icon-sm {
          width: 36px; height: 36px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .auth-form-container h2 {
          font-size: 1.75rem; margin-bottom: var(--space-2);
        }
        .auth-form-subtitle {
          color: var(--text-tertiary); font-size: 0.875rem;
          margin-bottom: var(--space-8);
        }
        .auth-form {
          display: flex; flex-direction: column; gap: var(--space-5);
        }
        .input-icon-wrapper {
          position: relative;
        }
        .input-icon-wrapper :global(.input-icon) {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text-tertiary); pointer-events: none;
        }
        .input-with-icon {
          padding-left: 40px !important;
        }
        .auth-form-options {
          display: flex; align-items: center; justify-content: space-between;
        }
        .auth-checkbox {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 0.8125rem; color: var(--text-secondary);
          cursor: pointer;
        }
        .auth-checkbox input {
          accent-color: var(--primary-500);
        }
        .auth-forgot {
          font-size: 0.8125rem; color: var(--primary-400);
          transition: color var(--transition-fast);
        }
        .auth-forgot:hover { color: var(--primary-300); }

        .auth-divider {
          display: flex; align-items: center; gap: var(--space-4);
          margin: var(--space-6) 0;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px;
          background: var(--glass-border);
        }
        .auth-divider span {
          font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase;
        }

        .auth-google-btn {
          gap: var(--space-3) !important;
        }

        .auth-switch {
          margin-top: var(--space-6);
          text-align: center;
          font-size: 0.875rem; color: var(--text-tertiary);
        }
        .auth-switch :global(a) {
          color: var(--primary-400); font-weight: 600;
          transition: color var(--transition-fast);
        }
        .auth-switch :global(a):hover { color: var(--primary-300); }

        @media (max-width: 768px) {
          .auth-right { padding: var(--space-6); }
        }
      `}</style>
    </div>
  );
}
