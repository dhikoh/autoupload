'use client';
import { useState, useEffect } from 'react';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import { ListOrdered, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Upload } from 'lucide-react';
import { postsAPI } from '@/lib/api';

function statusBadge(s) {
  const map = { completed: 'success', success: 'success', queued: 'warning', processing: 'info', partial: 'warning', failed: 'error', draft: 'info', pending: 'info', uploading: 'info' };
  return map[s] || 'info';
}

function statusIcon(s) {
  if (s === 'success' || s === 'completed') return <CheckCircle2 size={14} />;
  if (s === 'failed') return <XCircle size={14} />;
  if (s === 'processing' || s === 'uploading') return <Loader2 size={14} className="animate-spin" />;
  return <Clock size={14} />;
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QueuePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await postsAPI.list({ limit: 50 });
      setPosts(data.posts || []);
    } catch {} finally { setLoading(false); }
  }

  async function handleRetry(postId) {
    setRetrying(postId);
    try {
      await postsAPI.retry(postId);
      await loadPosts();
    } catch {} finally { setRetrying(null); }
  }

  const activePosts = posts.filter(p => ['queued', 'processing', 'partial', 'failed'].includes(p.status));
  const donePosts = posts.filter(p => ['completed'].includes(p.status));

  return (
    <>
      <TopBar title="Upload Queue" />
      <div className="page-content">
        <div className="queue-header animate-fade-in">
          <h2>Upload Queue</h2>
          <button className="btn btn-secondary btn-sm" onClick={loadPosts} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state glass-card-static">
            <Upload size={40} style={{ color: 'var(--text-tertiary)' }} />
            <p>No posts in queue. Create a new post to get started!</p>
          </div>
        ) : (
          <>
            {activePosts.length > 0 && (
              <div className="queue-section animate-fade-in-up">
                <h3 className="queue-section-title">Active ({activePosts.length})</h3>
                {activePosts.map(post => (
                  <div key={post.id} className="queue-item glass-card-static">
                    <div className="queue-item-top">
                      <div className="queue-item-info">
                        <span className="queue-item-caption">{post.caption || '(No caption)'}</span>
                        <span className="text-xs text-tertiary">{timeAgo(post.created_at)}</span>
                      </div>
                      <span className={`badge badge-${statusBadge(post.status)}`}>{post.status}</span>
                    </div>
                    <div className="queue-platforms">
                      {(post.platforms || []).map(pp => (
                        <div key={pp.id} className="queue-platform-row">
                          <PlatformBadge platform={pp.platform} showLabel={false} size="sm" />
                          <span className="text-sm">{pp.platform}</span>
                          <span className={`badge badge-sm badge-${statusBadge(pp.status)}`}>
                            {statusIcon(pp.status)} {pp.status}
                          </span>
                          {pp.error_message && <span className="text-xs" style={{ color: 'var(--error-400)' }}>{pp.error_message}</span>}
                        </div>
                      ))}
                    </div>
                    {(post.status === 'partial' || post.status === 'failed') && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleRetry(post.id)}
                        disabled={retrying === post.id}>
                        {retrying === post.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Retry Failed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {donePosts.length > 0 && (
              <div className="queue-section animate-fade-in-up delay-1">
                <h3 className="queue-section-title">Completed ({donePosts.length})</h3>
                {donePosts.map(post => (
                  <div key={post.id} className="queue-item glass-card-static">
                    <div className="queue-item-top">
                      <div className="queue-item-info">
                        <span className="queue-item-caption">{post.caption || '(No caption)'}</span>
                        <span className="text-xs text-tertiary">{timeAgo(post.created_at)}</span>
                      </div>
                      <span className={`badge badge-${statusBadge(post.status)}`}>{post.status}</span>
                    </div>
                    <div className="queue-platforms">
                      {(post.platforms || []).map(pp => (
                        <div key={pp.id} className="queue-platform-row">
                          <PlatformBadge platform={pp.platform} showLabel={false} size="sm" />
                          <span className="text-sm">{pp.platform}</span>
                          <span className={`badge badge-sm badge-${statusBadge(pp.status)}`}>{pp.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .queue-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); }
        .queue-section { margin-bottom: var(--space-6); }
        .queue-section-title { font-size: 0.8125rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3); }
        .queue-item { padding: var(--space-5); margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: var(--space-4); }
        .queue-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
        .queue-item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .queue-item-caption { font-size: 0.875rem; font-weight: 500; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .queue-platforms { display: flex; flex-direction: column; gap: var(--space-2); }
        .queue-platform-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); background: var(--glass-bg); }
        .queue-platform-row .text-sm { flex: 1; font-weight: 500; text-transform: capitalize; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-16); text-align: center; color: var(--text-tertiary); }
      `}</style>
    </>
  );
}
