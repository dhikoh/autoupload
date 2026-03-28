'use client';
import { useState, useEffect } from 'react';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import { History, Search, Trash2, Loader2, Filter } from 'lucide-react';
import { postsAPI } from '@/lib/api';

function statusBadge(s) {
  const map = { completed: 'success', success: 'success', queued: 'warning', processing: 'info', partial: 'warning', failed: 'error', draft: 'info' };
  return map[s] || 'info';
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadPosts(); }, [statusFilter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const data = await postsAPI.list(params);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }

  async function handleDelete(postId) {
    if (!confirm('Hapus post ini? File akan dihapus permanen.')) return;
    setDeleting(postId);
    try {
      await postsAPI.delete(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setTotal(prev => prev - 1);
    } catch {} finally { setDeleting(null); }
  }

  const filtered = search
    ? posts.filter(p => (p.caption || '').toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <>
      <TopBar title="History" />
      <div className="page-content">
        <div className="history-header animate-fade-in">
          <div>
            <h2>Post History</h2>
            <p className="text-sm text-secondary">{total} total posts</p>
          </div>
        </div>

        <div className="history-filters glass-card-static animate-fade-in">
          <div className="search-wrap">
            <Search size={16} />
            <input type="text" className="input-field" placeholder="Search posts..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            {['', 'completed', 'queued', 'partial', 'failed'].map(s => (
              <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state glass-card-static animate-fade-in">
            <History size={40} style={{ color: 'var(--text-tertiary)' }} />
            <p>{search ? 'No posts matching your search' : 'No post history yet'}</p>
          </div>
        ) : (
          <div className="history-table-wrap glass-card-static animate-fade-in-up">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Caption</th>
                  <th>Platforms</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post.id}>
                    <td className="caption-cell">{post.caption || '(No caption)'}</td>
                    <td>
                      <div className="platform-badges">
                        {(post.platforms || []).map(pp => (
                          <PlatformBadge key={pp.id} platform={pp.platform} showLabel={false} size="sm" />
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge badge-${statusBadge(post.status)}`}>{post.status}</span></td>
                    <td className="text-sm text-secondary">{formatDate(post.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}>
                        {deleting === post.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .history-header { margin-bottom: var(--space-6); }
        .history-header h2 { margin-bottom: var(--space-1); }
        .history-filters { padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-wrap :global(svg) { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
        .search-wrap .input-field { padding-left: 40px; }
        .filter-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        .filter-chip { padding: 4px 14px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); text-transform: capitalize; }
        .filter-chip:hover { border-color: var(--primary-500); color: var(--text-primary); }
        .filter-chip.active { background: rgba(124, 58, 237, 0.12); border-color: var(--primary-500); color: var(--primary-400); }
        .history-table-wrap { padding: var(--space-4); overflow-x: auto; }
        .caption-cell { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .platform-badges { display: flex; gap: var(--space-1); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-16); text-align: center; color: var(--text-tertiary); }
      `}</style>
    </>
  );
}
