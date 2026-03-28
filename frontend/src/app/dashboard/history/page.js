'use client';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import {
  Search, Filter, CheckCircle2, XCircle, Eye, RotateCcw,
  Trash2, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

const posts = [
  { id: 1, caption: 'New product launch video — discover the amazing features we have built...', platforms: ['youtube', 'instagram', 'tiktok'], status: 'success', date: 'Mar 28, 2026', time: '09:15' },
  { id: 2, caption: 'Behind the scenes of our photoshoot session today, it was incredible...', platforms: ['instagram', 'facebook', 'threads'], status: 'success', date: 'Mar 27, 2026', time: '14:30' },
  { id: 3, caption: 'Quick tips for social media marketing in 2026 that every creator needs...', platforms: ['youtube', 'x', 'threads'], status: 'partial', date: 'Mar 26, 2026', time: '10:00' },
  { id: 4, caption: 'Weekly motivation — never stop creating content that inspires people...', platforms: ['tiktok', 'instagram'], status: 'failed', date: 'Mar 25, 2026', time: '18:00' },
  { id: 5, caption: 'Exciting announcement coming soon! Stay tuned for something big...', platforms: ['facebook', 'x', 'instagram', 'tiktok'], status: 'success', date: 'Mar 24, 2026', time: '12:00' },
  { id: 6, caption: 'How to grow your audience organically — a comprehensive guide...', platforms: ['youtube', 'facebook'], status: 'success', date: 'Mar 23, 2026', time: '09:00' },
  { id: 7, caption: 'Celebrating 10K followers! Thank you all for the incredible support...', platforms: ['instagram', 'tiktok', 'threads', 'x'], status: 'success', date: 'Mar 22, 2026', time: '16:45' },
  { id: 8, caption: 'Content creation workflow — how I plan and execute my posts...', platforms: ['youtube', 'tiktok'], status: 'success', date: 'Mar 21, 2026', time: '11:30' },
];

export default function HistoryPage() {
  return (
    <>
      <TopBar title="Post History" />
      <div className="page-content">
        {/* Summary bar */}
        <div className="history-summary glass-card-static animate-fade-in">
          <div className="summary-item">
            <span className="summary-value">247</span>
            <span className="summary-label">Total Posts</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-value success">232</span>
            <span className="summary-label">Successful</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-value error">15</span>
            <span className="summary-label">Failed</span>
          </div>
        </div>

        {/* Filters */}
        <div className="history-filters animate-fade-in">
          <div className="history-search">
            <Search size={16} />
            <input type="text" placeholder="Search posts..." className="input-field" />
          </div>
          <select className="input-field history-select">
            <option>All Platforms</option>
            <option>YouTube</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Facebook</option>
            <option>X</option>
            <option>Threads</option>
          </select>
          <select className="input-field history-select">
            <option>All Status</option>
            <option>Success</option>
            <option>Failed</option>
            <option>Partial</option>
          </select>
          <input type="date" className="input-field history-date" />
        </div>

        {/* Posts table */}
        <div className="history-table-wrapper glass-card-static animate-fade-in-up delay-1">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caption</th>
                <th>Platforms</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <span className="history-caption">{post.caption}</span>
                  </td>
                  <td>
                    <div className="platform-badges">
                      {post.platforms.map(p => <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${post.status === 'success' ? 'badge-success' : post.status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                      {post.status === 'success' && <><CheckCircle2 size={10} /> Success</>}
                      {post.status === 'partial' && <><CheckCircle2 size={10} /> Partial</>}
                      {post.status === 'failed' && <><XCircle size={10} /> Failed</>}
                    </span>
                  </td>
                  <td>
                    <div className="history-date-cell">
                      <span>{post.date}</span>
                      <span className="text-xs text-tertiary">{post.time}</span>
                    </div>
                  </td>
                  <td>
                    <div className="history-actions">
                      <button className="btn btn-ghost btn-icon btn-sm tooltip" data-tip="View"><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm tooltip" data-tip="Repost"><RotateCcw size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm tooltip" data-tip="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="history-pagination animate-fade-in">
          <span className="text-sm text-tertiary">Showing 1-8 of 247</span>
          <div className="pagination-controls">
            <button className="btn btn-ghost btn-icon btn-sm"><ChevronLeft size={16} /></button>
            <button className="btn btn-ghost btn-sm pagination-num active">1</button>
            <button className="btn btn-ghost btn-sm pagination-num">2</button>
            <button className="btn btn-ghost btn-sm pagination-num">3</button>
            <span className="text-tertiary">...</span>
            <button className="btn btn-ghost btn-sm pagination-num">31</button>
            <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Summary */
        .history-summary {
          display: flex; align-items: center;
          padding: var(--space-5) var(--space-6);
          gap: var(--space-6);
          margin-bottom: var(--space-5);
        }

        .summary-item {
          display: flex; align-items: center; gap: var(--space-3);
        }

        .summary-value {
          font-size: 1.5rem; font-weight: 800;
        }

        .summary-value.success { color: var(--success-400); }
        .summary-value.error { color: var(--error-400); }

        .summary-label {
          font-size: 0.8125rem; color: var(--text-tertiary);
        }

        .summary-divider {
          width: 1px; height: 32px;
          background: var(--glass-border);
        }

        /* Filters */
        .history-filters {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-5);
          flex-wrap: wrap;
        }

        .history-search {
          position: relative; flex: 1; min-width: 200px;
        }

        .history-search :global(svg) {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .history-search .input-field {
          padding-left: 38px;
        }

        .history-select, .history-date {
          width: auto; min-width: 140px;
        }

        /* Table */
        .history-table-wrapper {
          overflow-x: auto;
          padding: var(--space-2);
        }

        .history-caption {
          display: block;
          max-width: 320px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .platform-badges {
          display: flex; gap: var(--space-1); flex-wrap: wrap;
        }

        .history-date-cell {
          display: flex; flex-direction: column;
        }

        .history-actions {
          display: flex; gap: var(--space-1);
        }

        /* Pagination */
        .history-pagination {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: var(--space-5);
        }

        .pagination-controls {
          display: flex; align-items: center; gap: var(--space-1);
        }

        .pagination-num {
          min-width: 32px;
        }

        .pagination-num.active {
          background: rgba(124, 58, 237, 0.12) !important;
          color: var(--primary-400) !important;
        }

        @media (max-width: 768px) {
          .history-summary { flex-direction: column; gap: var(--space-3); }
          .summary-divider { width: 100%; height: 1px; }
          .history-filters { flex-direction: column; }
          .history-select, .history-date { width: 100%; }
        }
      `}</style>
    </>
  );
}
