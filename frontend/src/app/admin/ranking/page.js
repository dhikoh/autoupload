'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import '../admin.css';

export default function AdminRankingPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRanking(); }, []);

  async function loadRanking() {
    try {
      const data = await adminAPI.ranking(50);
      setRankings(data.rankings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🏆 Upload Ranking</h1>
        <p>Ranking user berdasarkan jumlah upload per platform</p>
      </div>

      <div className="admin-section">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Platform</th>
                <th>Channel</th>
                <th>Uploads</th>
                <th>Success</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={`${r.user_id}-${r.platform}`}>
                  <td>
                    <span style={{
                      fontSize: i < 3 ? '1.3rem' : '0.9rem',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : 'inherit'
                    }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                  </td>
                  <td>
                    <strong>{r.user_name}</strong>
                    <br /><span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{r.user_email}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.platform === 'youtube' ? 'approved' : 'pending'}`}>
                      {r.platform}
                    </span>
                  </td>
                  <td>{r.platform_username || '-'}</td>
                  <td><strong>{r.total_uploads}</strong></td>
                  <td>{r.success_count}</td>
                  <td>
                    <span style={{ color: r.success_rate >= 80 ? '#22c55e' : r.success_rate >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {r.success_rate}%
                    </span>
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  Belum ada data upload
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
