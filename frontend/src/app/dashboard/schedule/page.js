'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import { postsAPI } from '@/lib/api';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const loadScheduled = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL posts and filter those with scheduled status + scheduled_at set
      const data = await postsAPI.list({ status: 'queued', limit: 100 });
      const withSchedule = (data.posts || []).filter(p => p.scheduled_at);
      setScheduledPosts(withSchedule);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadScheduled(); }, [loadScheduled]);

  function prevMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  // Build a map: "YYYY-MM-DD" -> posts[]
  const postsByDate = {};
  scheduledPosts.forEach(post => {
    if (!post.scheduled_at) return;
    const dt = new Date(post.scheduled_at);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (!postsByDate[key]) postsByDate[key] = [];
    postsByDate[key].push(post);
  });

  const selectedKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedPosts = selectedKey ? (postsByDate[selectedKey] || []) : [];
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build calendar grid (padding with empty cells)
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      <TopBar title="Jadwal Upload" />
      <div className="page-content">
        <div style={styles.container}>
          {/* Calendar Header */}
          <div style={styles.calHeader}>
            <button style={styles.navBtn} onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <h2 style={styles.monthLabel}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button style={styles.navBtn} onClick={nextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>

          {loading ? (
            <div style={styles.loading}><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div style={styles.calGrid}>
                {/* Day headers */}
                {DAY_NAMES.map(d => (
                  <div key={d} style={styles.dayHeader}>{d}</div>
                ))}
                {/* Day cells */}
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasPosts = !!postsByDate[key];
                  const isToday = key === todayKey;
                  const isSelected = selectedDay === day;
                  return (
                    <div key={day}
                      style={{
                        ...styles.dayCell,
                        ...(isToday ? styles.dayCellToday : {}),
                        ...(isSelected ? styles.dayCellSelected : {}),
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedDay(isSelected ? null : day)}>
                      <span style={styles.dayNum}>{day}</span>
                      {hasPosts && (
                        <div style={styles.dotRow}>
                          {postsByDate[key].slice(0, 3).map((_, di) => (
                            <div key={di} style={styles.dot} />
                          ))}
                          {postsByDate[key].length > 3 && (
                            <span style={styles.dotMore}>+{postsByDate[key].length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Posts List */}
              {selectedDay && (
                <div style={styles.selectedSection}>
                  <h3 style={styles.selectedTitle}>
                    <Calendar size={16} /> {selectedDay} {MONTH_NAMES[month]} {year}
                  </h3>
                  {selectedPosts.length === 0 ? (
                    <p style={styles.noPosts}>Tidak ada post terjadwal hari ini.</p>
                  ) : (
                    selectedPosts.map(post => (
                      <div key={post.id} style={styles.postCard}>
                        <div style={styles.postHeader}>
                          <div style={styles.postTime}>
                            <Clock size={12} />
                            {new Date(post.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span style={{
                            ...styles.statusBadge,
                            background: post.status === 'queued' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                            color: post.status === 'queued' ? '#f59e0b' : '#22c55e',
                          }}>
                            {post.status}
                          </span>
                        </div>
                        <p style={styles.postCaption}>{post.caption || post.file_name || 'No caption'}</p>
                        <div style={styles.platformRow}>
                          {(post.platforms || []).map(pp => (
                            <PlatformBadge key={pp.platform} platform={pp.platform} status={pp.status} />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Summary */}
              <div style={styles.summary}>
                <p style={styles.summaryText}>
                  📅 Total post terjadwal bulan ini:{' '}
                  <strong style={{ color: '#a5b4fc' }}>
                    {Object.entries(postsByDate).filter(([k]) =>
                      k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
                    ).reduce((sum, [, posts]) => sum + posts.length, 0)}
                  </strong>
                  {' '}post
                </p>
                {scheduledPosts.length === 0 && (
                  <p style={styles.emptyHint}>
                    💡 Belum ada jadwal. Buat post baru dan pilih waktu "Scheduled" saat upload.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { maxWidth: 640, margin: '0 auto' },
  calHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  monthLabel: { color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: 600 },
  navBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
  loading: { display: 'flex', justifyContent: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '1.5rem' },
  dayHeader: { textAlign: 'center', padding: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 },
  dayCell: { background: 'rgba(30,30,60,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.5rem', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.15s' },
  dayCellToday: { borderColor: 'rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.1)' },
  dayCellSelected: { borderColor: '#6366f1', background: 'rgba(99,102,241,0.2)' },
  dayNum: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 500 },
  dotRow: { display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: '50%', background: '#6366f1' },
  dotMore: { fontSize: '0.6rem', color: '#a5b4fc' },
  selectedSection: { background: 'rgba(30,30,60,0.6)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem' },
  selectedTitle: { color: '#fff', margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  noPosts: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem' },
  postCard: { background: 'rgba(15,15,35,0.6)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '0.5rem' },
  postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  postTime: { color: '#a5b4fc', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  statusBadge: { padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 },
  postCaption: { color: 'rgba(255,255,255,0.7)', margin: '0 0 0.5rem', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  platformRow: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  summary: { background: 'rgba(30,30,60,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem 1.25rem' },
  summaryText: { color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' },
  emptyHint: { color: 'rgba(255,255,255,0.4)', margin: '0.5rem 0 0', fontSize: '0.84rem' },
};
