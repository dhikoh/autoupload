'use client';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import { ChevronLeft, ChevronRight, Plus, Edit3, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

const scheduledPosts = {
  5: [{ time: '09:00', title: 'Marketing tips video', platforms: ['youtube', 'tiktok'] }],
  8: [
    { time: '10:00', title: 'Product launch carousel', platforms: ['instagram', 'facebook'] },
    { time: '15:00', title: 'Q&A session promo', platforms: ['youtube', 'x'] },
  ],
  12: [{ time: '18:00', title: 'Weekend vibes reel', platforms: ['instagram', 'tiktok', 'threads'] }],
  15: [{ time: '09:00', title: 'Monthly recap video', platforms: ['youtube', 'facebook'] }],
  20: [{ time: '12:00', title: 'New feature announcement', platforms: ['x', 'threads', 'facebook'] }],
  25: [{ time: '14:00', title: 'Behind the scenes', platforms: ['instagram', 'tiktok'] }],
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const [currentDate] = useState(new Date(2026, 2)); // March 2026
  const [selectedDay, setSelectedDay] = useState(8);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = 28;

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedPosts = scheduledPosts[selectedDay] || [];

  return (
    <>
      <TopBar title="Schedule" />
      <div className="page-content">
        <div className="schedule-layout">
          {/* Calendar */}
          <div className="calendar-section glass-card-static animate-fade-in">
            <div className="calendar-header">
              <button className="btn btn-ghost btn-icon btn-sm"><ChevronLeft size={16} /></button>
              <h3>{monthNames[month]} {year}</h3>
              <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={16} /></button>
            </div>

            <div className="calendar-weekdays">
              {daysOfWeek.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
            </div>

            <div className="calendar-grid">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`calendar-day ${!day ? 'empty' : ''} ${day === today ? 'today' : ''} ${day === selectedDay ? 'selected' : ''} ${scheduledPosts[day] ? 'has-posts' : ''}`}
                  onClick={() => day && setSelectedDay(day)}
                >
                  {day && (
                    <>
                      <span className="calendar-day-num">{day}</span>
                      {scheduledPosts[day] && (
                        <div className="calendar-day-dots">
                          {scheduledPosts[day].map((_, j) => <span key={j} className="calendar-dot" />)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected day detail */}
          <div className="schedule-detail">
            <div className="schedule-detail-header">
              <h3>{monthNames[month]} {selectedDay}, {year}</h3>
              <button className="btn btn-primary btn-sm"><Plus size={14} /> New Post</button>
            </div>

            {selectedPosts.length > 0 ? (
              <div className="schedule-posts">
                {selectedPosts.map((post, i) => (
                  <div key={i} className="schedule-post glass-card-static animate-fade-in">
                    <div className="schedule-post-time">
                      <Clock size={14} />
                      {post.time}
                    </div>
                    <div className="schedule-post-info">
                      <h4>{post.title}</h4>
                      <div className="platform-badges">
                        {post.platforms.map(p => <PlatformBadge key={p} platform={p} size="sm" />)}
                      </div>
                    </div>
                    <div className="schedule-post-actions">
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit3 size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="schedule-empty glass-card-static">
                <Clock size={32} />
                <p>No posts scheduled for this day</p>
                <button className="btn btn-outline btn-sm"><Plus size={14} /> Schedule Post</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .schedule-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-6);
        }

        /* Calendar */
        .calendar-section { padding: var(--space-5); }

        .calendar-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--space-5);
        }

        .calendar-header h3 { font-size: 1.125rem; }

        .calendar-weekdays {
          display: grid; grid-template-columns: repeat(7, 1fr);
          margin-bottom: var(--space-2);
        }

        .calendar-weekday {
          text-align: center; font-size: 0.75rem; font-weight: 600;
          color: var(--text-tertiary); padding: var(--space-2);
        }

        .calendar-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          gap: 4px;
        }

        .calendar-day.empty { cursor: default; }

        .calendar-day:not(.empty):hover {
          background: var(--glass-bg);
        }

        .calendar-day.today .calendar-day-num {
          background: var(--gradient-primary);
          width: 28px; height: 28px;
          border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700;
        }

        .calendar-day.selected {
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
        }

        .calendar-day-num {
          font-size: 0.8125rem; font-weight: 500;
        }

        .calendar-day-dots {
          display: flex; gap: 2px;
        }

        .calendar-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--primary-400);
        }

        /* Detail panel */
        .schedule-detail {
          display: flex; flex-direction: column; gap: var(--space-4);
        }

        .schedule-detail-header {
          display: flex; align-items: center; justify-content: space-between;
        }

        .schedule-detail-header h3 { font-size: 1rem; }

        .schedule-posts {
          display: flex; flex-direction: column; gap: var(--space-3);
        }

        .schedule-post {
          padding: var(--space-4);
          display: flex; align-items: flex-start; gap: var(--space-3);
        }

        .schedule-post-time {
          display: flex; align-items: center; gap: var(--space-1);
          font-size: 0.8125rem; font-weight: 600;
          color: var(--primary-400);
          min-width: 60px;
        }

        .schedule-post-info {
          flex: 1;
          display: flex; flex-direction: column; gap: var(--space-2);
        }

        .schedule-post-info h4 { font-size: 0.875rem; }

        .platform-badges {
          display: flex; gap: var(--space-1); flex-wrap: wrap;
        }

        .schedule-post-actions {
          display: flex; gap: var(--space-1);
        }

        .schedule-empty {
          padding: var(--space-10);
          display: flex; flex-direction: column;
          align-items: center; gap: var(--space-3);
          color: var(--text-tertiary);
          text-align: center;
        }

        .schedule-empty p { font-size: 0.875rem; }

        @media (max-width: 1024px) {
          .schedule-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
