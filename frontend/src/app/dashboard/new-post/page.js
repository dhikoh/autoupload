'use client';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import {
  Upload, Image, Film, X, Hash, Type, Globe,
  CalendarDays, Clock, Send, Save
} from 'lucide-react';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon as XBrandIcon, ThreadsIcon } from '../../../components/PlatformBadge';
import { useState } from 'react';

const platformList = [
  { id: 'youtube', name: 'YouTube', icon: YouTubeIcon, connected: true },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, connected: true },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, connected: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, connected: true },
  { id: 'x', name: 'X (Twitter)', icon: XBrandIcon, connected: false },
  { id: 'threads', name: 'Threads', icon: ThreadsIcon, connected: true },
];

export default function NewPostPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube', 'instagram', 'tiktok']);
  const [scheduleType, setScheduleType] = useState('now');
  const [sameCaption, setSameCaption] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setUploadedFile({ name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB', type: file.type.startsWith('video') ? 'video' : 'image' });
  };

  return (
    <>
      <TopBar title="New Post" />
      <div className="page-content">
        <div className="newpost-grid">
          {/* Left column */}
          <div className="newpost-left">
            {/* Upload zone */}
            <div className="glass-card-static upload-section">
              <h3 className="section-label">Upload Content</h3>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploadedFile ? 'has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && document.getElementById('file-input')?.click()}
              >
                {uploadedFile ? (
                  <div className="uploaded-file">
                    <div className="uploaded-file-icon">
                      {uploadedFile.type === 'video' ? <Film size={24} /> : <Image size={24} />}
                    </div>
                    <div className="uploaded-file-info">
                      <span className="uploaded-file-name">{uploadedFile.name}</span>
                      <span className="uploaded-file-size">{uploadedFile.size}</span>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); setUploadedFile(null); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-zone-icon">
                      <Upload size={28} />
                    </div>
                    <p className="upload-zone-text">Drag files here or <span>Browse</span></p>
                    <p className="upload-zone-hint">MP4, MOV, JPG, PNG — Max 500MB</p>
                  </>
                )}
                <input id="file-input" type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setUploadedFile({ name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB', type: file.type.startsWith('video') ? 'video' : 'image' });
                }} />
              </div>
            </div>

            {/* Caption */}
            <div className="glass-card-static caption-section">
              <div className="section-label-row">
                <h3 className="section-label">Caption & Details</h3>
                <label className="toggle-row">
                  <span className="text-sm text-secondary">Same for all</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={sameCaption} onChange={() => setSameCaption(!sameCaption)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>

              {sameCaption ? (
                <div className="input-group">
                  <label className="input-label">Caption</label>
                  <textarea className="input-field" rows={4} placeholder="Write your caption here..." />
                  <span className="text-xs text-tertiary">0 / 2200 characters</span>
                </div>
              ) : (
                <div className="caption-tabs">
                  {selectedPlatforms.map(p => (
                    <div key={p} className="caption-tab">
                      <PlatformBadge platform={p} size="sm" />
                      <textarea className="input-field" rows={3} placeholder={`Caption for ${p}...`} />
                    </div>
                  ))}
                </div>
              )}

              <div className="input-group">
                <label className="input-label"><Type size={14} /> Title (YouTube)</label>
                <input className="input-field" type="text" placeholder="Video title for YouTube..." />
              </div>

              <div className="input-group">
                <label className="input-label"><Hash size={14} /> Hashtags</label>
                <input className="input-field" type="text" placeholder="#marketing #content #tips" />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="newpost-right">
            {/* Platform selector */}
            <div className="glass-card-static platform-section">
              <h3 className="section-label">Select Platforms</h3>
              <div className="platform-list">
                {platformList.map(p => (
                  <label
                    key={p.id}
                    className={`platform-item ${selectedPlatforms.includes(p.id) ? 'selected' : ''} ${!p.connected ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p.id)}
                      onChange={() => p.connected && togglePlatform(p.id)}
                      disabled={!p.connected}
                    />
                    <p.icon size={18} />
                    <span className="platform-item-name">{p.name}</span>
                    {!p.connected && <span className="badge badge-warning">Not Connected</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="glass-card-static schedule-section">
              <h3 className="section-label">Schedule</h3>
              <div className="schedule-options">
                <label className={`schedule-option ${scheduleType === 'now' ? 'active' : ''}`}>
                  <input type="radio" name="schedule" value="now" checked={scheduleType === 'now'} onChange={e => setScheduleType(e.target.value)} />
                  <Send size={16} />
                  <span>Post Now</span>
                </label>
                <label className={`schedule-option ${scheduleType === 'later' ? 'active' : ''}`}>
                  <input type="radio" name="schedule" value="later" checked={scheduleType === 'later'} onChange={e => setScheduleType(e.target.value)} />
                  <Clock size={16} />
                  <span>Schedule</span>
                </label>
              </div>
              {scheduleType === 'later' && (
                <div className="schedule-picker animate-fade-in">
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input type="date" className="input-field" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Time</label>
                    <input type="time" className="input-field" />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              <button className="btn btn-primary btn-lg w-full">
                <Send size={18} />
                {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
              </button>
              <button className="btn btn-secondary w-full">
                <Save size={16} /> Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .newpost-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-6);
        }

        .newpost-left, .newpost-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .section-label {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: var(--space-4);
        }

        .section-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .section-label-row .section-label { margin-bottom: 0; }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
        }

        .upload-section, .caption-section, .platform-section, .schedule-section {
          padding: var(--space-6);
        }

        .caption-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .caption-section .section-label-row { margin-bottom: 0; }

        /* Upload Zone */
        .upload-zone {
          border: 2px dashed var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-10) var(--space-6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-base);
          text-align: center;
        }

        .upload-zone:hover, .upload-zone.drag-over {
          border-color: var(--primary-500);
          background: rgba(124, 58, 237, 0.05);
        }

        .upload-zone.has-file {
          padding: var(--space-4);
          cursor: default;
        }

        .upload-zone-icon {
          width: 64px; height: 64px;
          border-radius: var(--radius-xl);
          background: rgba(124, 58, 237, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-400);
          margin-bottom: var(--space-4);
        }

        .upload-zone-text {
          font-size: 0.9375rem; color: var(--text-secondary);
        }

        .upload-zone-text span {
          color: var(--primary-400); font-weight: 600;
        }

        .upload-zone-hint {
          font-size: 0.75rem; color: var(--text-tertiary);
          margin-top: var(--space-2);
        }

        .uploaded-file {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          width: 100%;
        }

        .uploaded-file-icon {
          width: 48px; height: 48px;
          border-radius: var(--radius-md);
          background: rgba(124, 58, 237, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-400);
        }

        .uploaded-file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .uploaded-file-name {
          font-size: 0.875rem; font-weight: 600;
        }

        .uploaded-file-size {
          font-size: 0.75rem; color: var(--text-tertiary);
        }

        /* Caption tabs */
        .caption-tabs {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .caption-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        /* Platform selector */
        .platform-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .platform-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-secondary);
        }

        .platform-item:hover {
          background: var(--glass-bg);
        }

        .platform-item.selected {
          background: rgba(124, 58, 237, 0.08);
          color: var(--text-primary);
        }

        .platform-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .platform-item input {
          accent-color: var(--primary-500);
        }

        .platform-item-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Schedule */
        .schedule-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .schedule-option {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .schedule-option input { display: none; }

        .schedule-option.active {
          background: rgba(124, 58, 237, 0.12);
          border-color: var(--primary-500);
          color: var(--primary-400);
        }

        .schedule-picker {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        @media (max-width: 1024px) {
          .newpost-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
