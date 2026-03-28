'use client';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw, Film } from 'lucide-react';

const queueItems = [
  {
    id: 1, caption: 'New product launch video — check out our latest features...', thumb: '🎬', time: '2 min ago', overall: 85,
    platforms: [
      { id: 'youtube', status: 'success', progress: 100 },
      { id: 'instagram', status: 'uploading', progress: 67 },
      { id: 'tiktok', status: 'queued', progress: 0 },
    ],
  },
  {
    id: 2, caption: 'Behind the scenes of our photoshoot session today...', thumb: '📸', time: '10 min ago', overall: 100,
    platforms: [
      { id: 'instagram', status: 'success', progress: 100 },
      { id: 'facebook', status: 'success', progress: 100 },
      { id: 'threads', status: 'success', progress: 100 },
    ],
  },
  {
    id: 3, caption: 'Quick tips for social media marketing...', thumb: '💡', time: '15 min ago', overall: 45,
    platforms: [
      { id: 'youtube', status: 'success', progress: 100 },
      { id: 'x', status: 'failed', progress: 0 },
      { id: 'threads', status: 'uploading', progress: 34 },
    ],
  },
  {
    id: 4, caption: 'Exciting announcement for our community...', thumb: '🎉', time: '30 min ago', overall: 0,
    platforms: [
      { id: 'facebook', status: 'queued', progress: 0 },
      { id: 'instagram', status: 'queued', progress: 0 },
      { id: 'tiktok', status: 'queued', progress: 0 },
      { id: 'youtube', status: 'queued', progress: 0 },
    ],
  },
];

const statusIcon = {
  success: <CheckCircle2 size={16} />,
  uploading: <Loader2 size={16} className="animate-spin" />,
  failed: <XCircle size={16} />,
  queued: <Clock size={16} />,
};

const statusLabel = { success: 'Done', uploading: 'Uploading', failed: 'Failed', queued: 'Queued' };

export default function QueuePage() {
  return (
    <>
      <TopBar title="Upload Queue" />
      <div className="page-content">
        {/* Filter tabs */}
        <div className="queue-tabs glass-card-static animate-fade-in">
          {['All', 'In Progress', 'Completed', 'Failed'].map((tab, i) => (
            <button key={tab} className={`queue-tab ${i === 0 ? 'active' : ''}`}>{tab}</button>
          ))}
        </div>

        {/* Queue items */}
        <div className="queue-list">
          {queueItems.map((item, idx) => (
            <div key={item.id} className={`queue-item glass-card-static animate-fade-in-up delay-${idx + 1}`}>
              <div className="queue-item-top">
                <div className="queue-thumb">{item.thumb}</div>
                <div className="queue-item-info">
                  <p className="queue-caption">{item.caption}</p>
                  <span className="text-xs text-tertiary">Started {item.time}</span>
                </div>
              </div>

              <div className="queue-platforms">
                {item.platforms.map(p => (
                  <div key={p.id} className={`queue-platform-status status-${p.status}`}>
                    <PlatformBadge platform={p.id} showLabel={false} size="sm" />
                    <span className="queue-status-icon">{statusIcon[p.status]}</span>
                    <span className="queue-status-text">
                      {p.status === 'uploading' ? `${p.progress}%` : statusLabel[p.status]}
                    </span>
                    {p.status === 'failed' && (
                      <button className="btn btn-ghost btn-sm queue-retry">
                        <RotateCcw size={12} /> Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${item.overall}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .queue-tabs {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-2);
          margin-bottom: var(--space-6);
          width: fit-content;
        }

        .queue-tab {
          padding: var(--space-2) var(--space-5);
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .queue-tab:hover { color: var(--text-primary); background: var(--glass-bg); }
        .queue-tab.active { color: var(--text-primary); background: rgba(124, 58, 237, 0.12); }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .queue-item {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .queue-item-top {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .queue-thumb {
          width: 48px; height: 48px;
          border-radius: var(--radius-md);
          background: var(--glass-bg-active);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .queue-item-info { flex: 1; }

        .queue-caption {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 500px;
          margin-bottom: 2px;
        }

        .queue-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .queue-platform-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .queue-status-icon { display: flex; align-items: center; }

        .status-success .queue-status-icon { color: var(--success-400); }
        .status-success .queue-status-text { color: var(--success-400); }
        .status-uploading .queue-status-icon { color: var(--accent-400); }
        .status-uploading .queue-status-text { color: var(--accent-400); }
        .status-failed .queue-status-icon { color: var(--error-400); }
        .status-failed .queue-status-text { color: var(--error-400); }
        .status-queued .queue-status-icon { color: var(--text-tertiary); }
        .status-queued .queue-status-text { color: var(--text-tertiary); }

        .queue-retry {
          font-size: 0.6875rem !important;
          padding: 2px 6px !important;
          color: var(--error-400) !important;
        }

        @media (max-width: 768px) {
          .queue-tabs { width: 100%; overflow-x: auto; }
          .queue-caption { max-width: 200px; }
          .queue-platforms { gap: var(--space-2); }
        }
      `}</style>
    </>
  );
}
