'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import './admin.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingTopups, setPendingTopups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, topupsData] = await Promise.all([
        adminAPI.stats(),
        adminAPI.topups({ status: 'pending', limit: 5 }),
      ]);
      setStats(statsData);
      setPendingTopups(topupsData.topups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">📤</div>
          <div className="stat-info">
            <h3>{stats?.total_posts || 0}</h3>
            <p>Total Posts</p>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Rp {(stats?.total_revenue || 0).toLocaleString('id-ID')}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats?.pending_topups || 0}</h3>
            <p>Pending Top-Up</p>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats?.active_users || 0}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card stat-muted">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <h3>{stats?.suspended_users || 0}</h3>
            <p>Suspended</p>
          </div>
        </div>
      </div>

      {pendingTopups.length > 0 && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🔔 Pending Top-Up Requests</h2>
            <Link href="/admin/topups" className="btn btn-sm btn-primary">View All</Link>
          </div>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTopups.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.user_name || 'Unknown'}</strong>
                      <br /><span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{t.user_email}</span>
                    </td>
                    <td>Rp {t.amount.toLocaleString('id-ID')}</td>
                    <td>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <Link href="/admin/topups" className="btn btn-sm btn-primary">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
