'use client';
import { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import StatsCard from '../../components/StatsCard';
import PlatformBadge from '../../components/PlatformBadge';
import Link from 'next/link';
import {
  BarChart3, CalendarDays, CheckCircle2, Link2, Wallet,
  ArrowUpRight, Plus, Clock, MoreHorizontal, Loader2
} from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusBadge(s) {
  const map = { completed: 'success', success: 'success', queued: 'warning', processing: 'info', partial: 'warning', failed: 'error', draft: 'info' };
  return map[s] || 'info';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.all([
          postsAPI.stats(),
          postsAPI.list({ limit: 5 }),
        ]);
        setStats(s);
        setPosts(p.posts || []);
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '200px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page-content">
        {/* Stats */}
        {/* Balance Card */}
        <div className="glass-card-static animate-fade-in" style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          borderColor: 'rgba(99,102,241,0.25)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.85rem' }}>Saldo Anda</p>
            <h2 style={{ color: '#fff', margin: '0.25rem 0 0', fontSize: '1.8rem' }}>
              Rp {(user?.balance || stats?.balance || 0).toLocaleString('id-ID')}
            </h2>
            <p style={{ color: 'var(--text-tertiary)', margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              Harga upload: Rp {(stats?.upload_price || 1000).toLocaleString('id-ID')}/file
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/dashboard/topup" className="btn btn-primary">💳 Top-Up</Link>
            <Link href="/dashboard/balance" className="btn btn-ghost">📋 Riwayat</Link>
          </div>
        </div>

        <div className="stats-grid animate-fade-in">
          <StatsCard icon={BarChart3} label="Total Posts" value={stats?.total_posts ?? 0} />
          <StatsCard icon={CalendarDays} label="Scheduled" value={stats?.scheduled ?? 0} />
          <StatsCard icon={CheckCircle2} label="Success Rate" value={`${stats?.success_rate ?? 0}%`} />
          <StatsCard icon={Link2} label="Connected" value={stats?.connected_accounts ?? 0} />
        </div>

        <div className="dashboard-grid">
          {/* Recent Activity */}
          <div className="glass-card-static dashboard-activity animate-fade-in-up delay-1">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <Link href="/dashboard/history" className="btn btn-ghost btn-sm">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-tertiary)' }}>
                <p>No posts yet. Create your first post!</p>
                <Link href="/dashboard/new-post" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                  <Plus size={16} /> New Post
                </Link>
              </div>
            ) : (
              <div className="activity-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Caption</th>
                      <th>Platforms</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id}>
                        <td className="caption-cell">{post.caption || '(No caption)'}</td>
                        <td>
                          <div className="platform-badges">
                            {(post.platforms || []).map(p => (
                              <PlatformBadge key={p.id} platform={p.platform} showLabel={false} size="sm" />
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${statusBadge(post.status)}`}>
                            {post.status}
                          </span>
                        </td>
                        <td className="text-sm text-secondary">{timeAgo(post.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="dashboard-right">
            <Link href="/dashboard/new-post" className="glass-card quick-upload animate-fade-in-up delay-2">
              <div className="quick-upload-icon">
                <Plus size={24} />
              </div>
              <div>
                <h4>New Post</h4>
                <p className="text-sm text-secondary">Upload and publish content</p>
              </div>
              <ArrowUpRight size={18} className="quick-upload-arrow" />
            </Link>

            <div className="glass-card-static upcoming-card animate-fade-in-up delay-3">
              <div className="card-header">
                <h4>Quick Stats</h4>
              </div>
              <div className="upcoming-list">
                <div className="upcoming-item">
                  <div className="upcoming-time"><Clock size={14} /> Total</div>
                  <div className="upcoming-info">
                    <span className="upcoming-title">{stats?.total_posts ?? 0} posts created</span>
                  </div>
                </div>
                <div className="upcoming-item">
                  <div className="upcoming-time"><CheckCircle2 size={14} /> Rate</div>
                  <div className="upcoming-info">
                    <span className="upcoming-title">{stats?.success_rate ?? 0}% success rate</span>
                  </div>
                </div>
                <div className="upcoming-item">
                  <div className="upcoming-time"><Link2 size={14} /> Acct</div>
                  <div className="upcoming-info">
                    <span className="upcoming-title">{stats?.connected_accounts ?? 0} platforms connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-5); margin-bottom: var(--space-6); }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 360px; gap: var(--space-6); }
        .dashboard-activity { padding: var(--space-5); }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); }
        .card-header h3, .card-header h4 { font-size: 1rem; }
        .activity-table-wrapper { overflow-x: auto; }
        .caption-cell { max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .platform-badges { display: flex; gap: var(--space-1); flex-wrap: wrap; }
        .dashboard-right { display: flex; flex-direction: column; gap: var(--space-5); }
        .quick-upload { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5); cursor: pointer; }
        .quick-upload-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .quick-upload-arrow { margin-left: auto; color: var(--text-tertiary); transition: all var(--transition-fast); }
        .quick-upload:hover .quick-upload-arrow { color: var(--primary-400); transform: translate(2px, -2px); }
        .upcoming-card { padding: var(--space-5); }
        .upcoming-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .upcoming-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); transition: background var(--transition-fast); }
        .upcoming-item:hover { background: var(--glass-bg); }
        .upcoming-time { display: flex; align-items: center; gap: var(--space-2); font-size: 0.8125rem; font-weight: 600; color: var(--primary-400); min-width: 70px; }
        .upcoming-info { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
        .upcoming-title { font-size: 0.8125rem; font-weight: 500; }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .dashboard-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-3); } }
      `}</style>
    </>
  );
}
