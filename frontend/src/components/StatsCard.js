'use client';

export default function StatsCard({ icon: Icon, label, value, trend, trendUp }) {
  return (
    <>
      <div className="stats-card glass-card">
        <div className="stats-card-header">
          <div className="stats-card-icon">
            <Icon size={20} />
          </div>
          {trend && (
            <span className={`stats-card-trend ${trendUp ? 'up' : 'down'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-label">{label}</div>
      </div>

      <style jsx>{`
        .stats-card {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .stats-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stats-card-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(124, 58, 237, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-400);
        }

        .stats-card-trend {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .stats-card-trend.up {
          background: var(--success-bg);
          color: var(--success-400);
        }

        .stats-card-trend.down {
          background: var(--error-bg);
          color: var(--error-400);
        }

        .stats-card-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }

        .stats-card-label {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
