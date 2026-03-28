'use client';

export default function StatsCard({ icon: Icon, label, value, trend, trendUp }) {
  return (
    <>
      <div className="stats-card neuglass-card">
        <div className="stats-icon-wrap">
          <Icon size={20} />
        </div>
        <div className="stats-info">
          <span className="stats-value">{value}</span>
          <span className="stats-label">{label}</span>
        </div>
        {trend && (
          <span className={`stats-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <style jsx>{`
        .stats-card {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: relative;
          overflow: hidden;
        }

        .stats-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
          opacity: 0;
          transition: opacity var(--transition-base);
        }

        .stats-card:hover::before {
          opacity: 1;
        }

        .stats-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          box-shadow: var(--neu-shadow-in-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-400);
        }

        .stats-info {
          display: flex;
          flex-direction: column;
        }

        .stats-value {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .stats-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: var(--space-1);
        }

        .stats-trend {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .stats-trend.up {
          color: var(--success-400);
          background: var(--success-bg);
        }

        .stats-trend.down {
          color: var(--error-400);
          background: var(--error-bg);
        }
      `}</style>
    </>
  );
}
