'use client';
import Link from 'next/link';
import {
  Zap, Upload, CalendarDays, Activity, ArrowRight, Check, ChevronRight
} from 'lucide-react';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon, ThreadsIcon } from '../components/PlatformBadge';

const features = [
  { icon: Upload, title: 'Multi-Platform Upload', desc: 'Upload once, publish to all your connected social media accounts simultaneously.' },
  { icon: CalendarDays, title: 'Smart Scheduling', desc: 'Schedule posts for the perfect time. Plan your content calendar in advance.' },
  { icon: Activity, title: 'Real-Time Tracking', desc: 'Monitor upload progress across all platforms with live status updates.' },
];

const steps = [
  { num: '01', title: 'Connect Accounts', desc: 'Link your social media accounts via secure OAuth authentication.' },
  { num: '02', title: 'Upload Content', desc: 'Drag & drop your video or image. Add captions customized per platform.' },
  { num: '03', title: 'Auto-Publish', desc: 'Hit publish and watch your content go live everywhere instantly.' },
];

const plans = [
  { name: 'Free', price: 'Rp 0', period: '/forever', features: ['3 platforms', '10 posts/month', '1 account', 'Basic analytics'], cta: 'Get Started', popular: false },
  { name: 'Starter', price: 'Rp 99K', period: '/month', features: ['5 platforms', '50 posts/month', '3 accounts', 'Scheduling', 'Priority support'], cta: 'Start Trial', popular: false },
  { name: 'Pro', price: 'Rp 249K', period: '/month', features: ['All platforms', 'Unlimited posts', '10 accounts', 'Advanced scheduling', 'Analytics dashboard', 'Priority support'], cta: 'Go Pro', popular: true },
  { name: 'Agency', price: 'Rp 599K', period: '/month', features: ['Everything in Pro', 'Unlimited accounts', 'Team collaboration', 'API access', 'White-label ready', 'Dedicated support'], cta: 'Contact Us', popular: false },
];

const platformIcons = [
  { icon: YouTubeIcon, color: '#FF0000' },
  { icon: FacebookIcon, color: '#1877F2' },
  { icon: InstagramIcon, color: '#E4405F' },
  { icon: TikTokIcon, color: '#00F2EA' },
  { icon: XIcon, color: '#ffffff' },
  { icon: ThreadsIcon, color: '#ffffff' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <div className="landing-nav-logo-icon"><Zap size={18} /></div>
            <span>AutoPost<span className="text-gradient">Hub</span></span>
          </div>
          <div className="landing-nav-links hide-mobile">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">
            <Zap size={14} /> Now supporting 6 platforms
          </div>
          <h1>Upload Once,<br /><span className="text-gradient">Post Everywhere</span></h1>
          <p className="hero-subtitle">
            Publish your content to YouTube, Instagram, TikTok, Facebook, X, and Threads — all from one dashboard. Save hours every day.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="btn btn-secondary btn-lg">
              See Features
            </Link>
          </div>
          {/* Platform icons */}
          <div className="hero-platforms">
            {platformIcons.map((p, i) => (
              <div key={i} className="hero-platform-icon animate-fade-in" style={{ animationDelay: `${0.6 + i * 0.1}s`, color: p.color }}>
                <p.icon size={24} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="section">
        <div className="section-inner">
          <h2 className="section-title animate-fade-in-up">Everything You Need</h2>
          <p className="section-subtitle animate-fade-in-up delay-1">Powerful features to streamline your social media workflow</p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card glass-card animate-fade-in-up delay-${i + 2}`}>
                <div className="feature-icon"><f.icon size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to automate your social media</p>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < 2 && <ChevronRight className="step-arrow hide-mobile" size={20} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section">
        <div className="section-inner">
          <h2 className="section-title">Simple Pricing</h2>
          <p className="section-subtitle">Start free, upgrade when you need more</p>
          <div className="pricing-grid">
            {plans.map((plan, i) => (
              <div key={i} className={`pricing-card glass-card ${plan.popular ? 'pricing-popular' : ''}`}>
                {plan.popular && <div className="pricing-popular-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="pricing-price">
                  <span className="pricing-amount">{plan.price}</span>
                  <span className="pricing-period">{plan.period}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feat, j) => (
                    <li key={j}><Check size={16} /> {feat}</li>
                  ))}
                </ul>
                <button className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-nav-logo">
              <div className="landing-nav-logo-icon"><Zap size={18} /></div>
              <span>AutoPost<span className="text-gradient">Hub</span></span>
            </div>
            <p>Upload once, post everywhere.</p>
          </div>
          <div className="footer-links">
            <div>
              <h5>Product</h5>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <h5>Company</h5>
              <a href="#">About</a>
              <a href="#">Contact</a>
            </div>
            <div>
              <h5>Legal</h5>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AutoPost Hub. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .landing { overflow-x: hidden; }

        /* Navbar */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(6, 6, 15, 0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
        }
        .landing-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 var(--space-6);
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .landing-nav-logo {
          display: flex; align-items: center; gap: var(--space-3);
          font-size: 1.125rem; font-weight: 800;
        }
        .landing-nav-logo-icon {
          width: 32px; height: 32px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .landing-nav-links {
          display: flex; gap: var(--space-8);
        }
        .landing-nav-links a {
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }
        .landing-nav-links a:hover { color: var(--text-primary); }
        .landing-nav-actions {
          display: flex; align-items: center; gap: var(--space-3);
        }

        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          padding: 120px var(--space-6) 80px;
        }
        .hero-glow {
          position: absolute;
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .hero-content { position: relative; max-width: 720px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: var(--space-2);
          padding: 6px 16px; margin-bottom: var(--space-6);
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: var(--radius-full);
          font-size: 0.8125rem; font-weight: 600;
          color: var(--primary-300);
        }
        .hero h1 { font-size: 3.5rem; margin-bottom: var(--space-6); line-height: 1.1; }
        .hero-subtitle {
          font-size: 1.125rem; color: var(--text-secondary);
          max-width: 540px; margin: 0 auto var(--space-8);
          line-height: 1.7;
        }
        .hero-actions {
          display: flex; align-items: center; justify-content: center;
          gap: var(--space-4); flex-wrap: wrap;
        }
        .hero-platforms {
          display: flex; align-items: center; justify-content: center;
          gap: var(--space-5); margin-top: var(--space-12);
        }
        .hero-platform-icon {
          width: 52px; height: 52px;
          border-radius: var(--radius-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-base);
        }
        .hero-platform-icon:hover {
          background: var(--glass-bg-hover);
          transform: translateY(-4px);
          box-shadow: var(--shadow-glow-sm);
        }

        /* Sections */
        .section {
          padding: 100px var(--space-6);
        }
        .section-alt {
          background: rgba(255, 255, 255, 0.01);
        }
        .section-inner {
          max-width: 1200px; margin: 0 auto;
          text-align: center;
        }
        .section-title {
          font-size: 2.25rem; margin-bottom: var(--space-3);
        }
        .section-subtitle {
          font-size: 1rem; color: var(--text-secondary);
          margin-bottom: var(--space-12);
        }

        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
        }
        .feature-card {
          padding: var(--space-8);
          text-align: left;
        }
        .feature-icon {
          width: 48px; height: 48px;
          border-radius: var(--radius-md);
          background: rgba(124, 58, 237, 0.12);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-400);
          margin-bottom: var(--space-5);
        }
        .feature-card h3 {
          margin-bottom: var(--space-3); font-size: 1.125rem;
        }
        .feature-card p {
          color: var(--text-secondary); font-size: 0.875rem; line-height: 1.7;
        }

        /* Steps */
        .steps-grid {
          display: flex; align-items: flex-start; justify-content: center;
          gap: var(--space-6);
        }
        .step-card {
          flex: 1; max-width: 300px;
          text-align: center; padding: var(--space-6);
          position: relative;
        }
        .step-num {
          font-size: 3rem; font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-4);
          line-height: 1;
        }
        .step-card h3 { margin-bottom: var(--space-3); }
        .step-card p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.7; }
        .step-arrow {
          position: absolute; right: -22px; top: 45px;
          color: var(--text-tertiary);
        }

        /* Pricing */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
          text-align: left;
        }
        .pricing-card {
          padding: var(--space-6);
          display: flex; flex-direction: column;
          position: relative;
        }
        .pricing-popular {
          border-color: var(--primary-500);
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.15);
        }
        .pricing-popular-badge {
          position: absolute; top: -12px; left: 50%;
          transform: translateX(-50%);
          padding: 4px 16px;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          font-size: 0.6875rem; font-weight: 700;
          color: #fff; white-space: nowrap;
        }
        .pricing-card h3 {
          font-size: 1.125rem; margin-bottom: var(--space-4);
        }
        .pricing-price { margin-bottom: var(--space-5); }
        .pricing-amount { font-size: 2rem; font-weight: 800; }
        .pricing-period { font-size: 0.875rem; color: var(--text-tertiary); }
        .pricing-features {
          flex: 1;
          display: flex; flex-direction: column; gap: var(--space-3);
          margin-bottom: var(--space-6);
        }
        .pricing-features li {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 0.8125rem; color: var(--text-secondary);
        }
        .pricing-features li :global(svg) { color: var(--success-400); flex-shrink: 0; }

        /* Footer */
        .footer {
          border-top: 1px solid var(--glass-border);
          padding: var(--space-12) var(--space-6) 0;
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; justify-content: space-between;
          gap: var(--space-8);
        }
        .footer-brand p {
          margin-top: var(--space-3);
          font-size: 0.875rem; color: var(--text-tertiary);
        }
        .footer-links {
          display: flex; gap: var(--space-12);
        }
        .footer-links div {
          display: flex; flex-direction: column; gap: var(--space-3);
        }
        .footer-links h5 {
          font-weight: 600; margin-bottom: var(--space-2);
          color: var(--text-primary);
        }
        .footer-links a {
          font-size: 0.8125rem; color: var(--text-tertiary);
          transition: color var(--transition-fast);
        }
        .footer-links a:hover { color: var(--text-primary); }
        .footer-bottom {
          max-width: 1200px; margin: var(--space-8) auto 0;
          padding: var(--space-6) 0;
          border-top: 1px solid var(--glass-border);
          text-align: center;
          font-size: 0.8125rem; color: var(--text-tertiary);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero h1 { font-size: 2.25rem; }
          .hero-subtitle { font-size: 1rem; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { flex-direction: column; align-items: center; }
          .step-arrow { display: none; }
          .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
          .footer-inner { flex-direction: column; }
          .footer-links { flex-wrap: wrap; gap: var(--space-8); }
        }

        @media (max-width: 1024px) and (min-width: 769px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
