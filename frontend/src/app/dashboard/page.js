'use client';
import TopBar from '../../components/TopBar';
import StatsCard from '../../components/StatsCard';
import PlatformBadge from '../../components/PlatformBadge';
import Link from 'next/link';
import {
  BarChart3, Upload, CalendarDays, CheckCircle2, Link2,
  ArrowUpRight, Plus, Clock, MoreHorizontal
} from 'lucide-react';

const recentPosts = [
  { id: 1, caption: 'New product launch video — check out our latest...', platforms: ['youtube', 'instagram', 'tiktok'], status: 'success', date: '2 hours ago' },
  { id: 2, caption: 'Behind the scenes of our photoshoot session...', platforms: ['instagram', 'facebook', 'threads'], status: 'success', date: '5 hours ago' },
  { id: 3, caption: 'Quick tips for social media marketing in 2026...', platforms: ['youtube', 'x', 'threads'], status: 'scheduled', date: 'Tomorrow 09:00' },
  { id: 4, caption: 'Weekly motivation — never stop creating content...', platforms: ['tiktok', 'instagram'], status: 'failed', date: '1 day ago' },
  { id: 5, caption: 'Exciting announcement coming soon! Stay tuned...', platforms: ['facebook', 'x', 'instagram', 'tiktok'], status: 'success', date: '2 days ago' },
];

const upcomingSchedule = [
  { time: '09:00', title: 'Marketing tips video', platforms: ['youtube', 'tiktok'] },
  { time: '12:00', title: 'Product showcase carousel', platforms: ['instagram', 'facebook'] },
  { time: '18:00', title: 'End-of-day recap story', platforms: ['instagram', 'tiktok', 'threads'] },
];

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid animate-fade-in">
          <StatsCard icon={BarChart3} label="Total Posts" value="247" trend="12%" trendUp />
          <StatsCard icon={CalendarDays} label="Scheduled" value="12" trend="3" trendUp />
          <StatsCard icon={CheckCircle2} label="Success Rate" value="94.2%" trend="2.1%" trendUp />
          <StatsCard icon={Link2} label="Connected" value="5" />
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
                  {recentPosts.map(post => (
                    <tr key={post.id}>
                      <td className="caption-cell">{post.caption}</td>
                      <td>
                        <div className="platform-badges">
                          {post.platforms.map(p => (
                            <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${post.status === 'success' ? 'success' : post.status === 'scheduled' ? 'warning' : 'error'}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{post.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="dashboard-right">
            {/* Quick Upload */}
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

            {/* Upcoming Schedule */}
            <div className="glass-card-static upcoming-card animate-fade-in-up delay-3">
              <div className="card-header">
                <h4>Upcoming Today</h4>
                <Link href="/dashboard/schedule" className="btn btn-ghost btn-sm">
                  <CalendarDays size={14} />
                </Link>
              </div>
              <div className="upcoming-list">
                {upcomingSchedule.map((item, i) => (
                  <div key={i} className="upcoming-item">
                    <div className="upcoming-time">
                      <Clock size={14} />
                      {item.time}
                    </div>
                    <div className="upcoming-info">
                      <span className="upcoming-title">{item.title}</span>
                      <div className="platform-badges">
                        {item.platforms.map(p => (
                          <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--space-6);
        }

        .dashboard-activity {
          padding: var(--space-5);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-5);
        }

        .card-header h3, .card-header h4 {
          font-size: 1rem;
        }

        .activity-table-wrapper {
          overflow-x: auto;
        }

        .caption-cell {
          max-width: 280px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .platform-badges {
          display: flex;
          gap: var(--space-1);
          flex-wrap: wrap;
        }

        .dashboard-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .quick-upload {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
          cursor: pointer;
        }

        .quick-upload-icon {
          width: 48px; height: 48px;
          border-radius: var(--radius-lg);
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .quick-upload-arrow {
          margin-left: auto;
          color: var(--text-tertiary);
          transition: all var(--transition-fast);
        }

        .quick-upload:hover .quick-upload-arrow {
          color: var(--primary-400);
          transform: translate(2px, -2px);
        }

        .upcoming-card {
          padding: var(--space-5);
        }

        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .upcoming-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .upcoming-item:hover {
          background: var(--glass-bg);
        }

        .upcoming-time {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary-400);
          min-width: 70px;
        }

        .upcoming-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .upcoming-title {
          font-size: 0.8125rem;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-3);
          }
        }
      `}</style>
    </>
  );
}
