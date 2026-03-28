'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../../components/TopBar';
import PlatformBadge from '../../../components/PlatformBadge';
import {
  Upload, Image, Film, X, Hash, Type,
  CalendarDays, Clock, Send, Loader2
} from 'lucide-react';
import { YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon as XBrandIcon, ThreadsIcon } from '../../../components/PlatformBadge';
import { uploadAPI, postsAPI, accountsAPI } from '@/lib/api';

const platformMeta = {
  youtube: { name: 'YouTube', icon: YouTubeIcon },
  facebook: { name: 'Facebook', icon: FacebookIcon },
  instagram: { name: 'Instagram', icon: InstagramIcon },
  tiktok: { name: 'TikTok', icon: TikTokIcon },
  x: { name: 'X (Twitter)', icon: XBrandIcon },
  threads: { name: 'Threads', icon: ThreadsIcon },
};

export default function NewPostPage() {
  const router = useRouter();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduleType, setScheduleType] = useState('now');
  const [sameCaption, setSameCaption] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState(null);      // raw File object
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null); // response from /api/upload
  const [uploading, setUploading] = useState(false);

  // Form state
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch connected accounts on mount
  useEffect(() => {
    accountsAPI.list().then(accounts => {
      setConnectedAccounts(accounts || []);
      // Pre-select connected platforms
      setSelectedPlatforms((accounts || []).map(a => a.platform));
    }).catch(() => {});
  }, []);

  const connectedPlatformIds = connectedAccounts.map(a => a.platform);

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Handle file select (drag or browse)
  function handleFile(file) {
    if (!file) return;
    setSelectedFile(file);
    setUploadedFileInfo({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      type: file.type.startsWith('video') ? 'video' : 'image',
    });
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  };

  // Upload file + create post
  async function handlePublish() {
    setError('');
    setSuccess('');

    if (!selectedFile) { setError('Pilih file terlebih dahulu'); return; }
    if (selectedPlatforms.length === 0) { setError('Pilih minimal 1 platform'); return; }

    setSubmitting(true);
    try {
      // Step 1: Upload file
      setUploading(true);
      const fileData = await uploadAPI.uploadFile(selectedFile);
      setUploading(false);

      // Step 2: Create post with file metadata from upload
      const postData = {
        caption: caption || null,
        hashtags: hashtags || null,
        youtube_title: youtubeTitle || null,
        platforms: selectedPlatforms,
        file_path: fileData.file_path,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
        file_type: fileData.file_type,
      };

      if (scheduleType === 'later' && scheduleDate && scheduleTime) {
        postData.schedule_at = `${scheduleDate}T${scheduleTime}:00`;
      }

      await postsAPI.create(postData);

      setSuccess('Post berhasil dibuat dan sedang diproses!');
      setTimeout(() => router.push('/dashboard/queue'), 1500);
    } catch (err) {
      setError(err.message || 'Gagal membuat post');
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar title="New Post" />
      <div className="page-content">
        {error && <div className="alert-error animate-fade-in">{error}</div>}
        {success && <div className="alert-success animate-fade-in">{success}</div>}

        <div className="newpost-grid">
          {/* Left column */}
          <div className="newpost-left">
            <div className="glass-card-static upload-section">
              <h3 className="section-label">Upload Content</h3>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploadedFileInfo ? 'has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploadedFileInfo && document.getElementById('file-input')?.click()}
              >
                {uploadedFileInfo ? (
                  <div className="uploaded-file">
                    <div className="uploaded-file-icon">
                      {uploadedFileInfo.type === 'video' ? <Film size={24} /> : <Image size={24} />}
                    </div>
                    <div className="uploaded-file-info">
                      <span className="uploaded-file-name">{uploadedFileInfo.name}</span>
                      <span className="uploaded-file-size">{uploadedFileInfo.size}</span>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadedFileInfo(null); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-zone-icon"><Upload size={28} /></div>
                    <p className="upload-zone-text">Drag files here or <span>Browse</span></p>
                    <p className="upload-zone-hint">MP4, MOV, JPG, PNG — Max 500MB</p>
                  </>
                )}
                <input id="file-input" type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
              </div>
            </div>

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

              <div className="input-group">
                <label className="input-label">Caption</label>
                <textarea className="input-field" rows={4} placeholder="Write your caption here..."
                  value={caption} onChange={e => setCaption(e.target.value)} />
                <span className="text-xs text-tertiary">{caption.length} / 2200 characters</span>
              </div>

              <div className="input-group">
                <label className="input-label"><Type size={14} /> Title (YouTube)</label>
                <input className="input-field" type="text" placeholder="Video title for YouTube..."
                  value={youtubeTitle} onChange={e => setYoutubeTitle(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label"><Hash size={14} /> Hashtags</label>
                <input className="input-field" type="text" placeholder="#marketing #content #tips"
                  value={hashtags} onChange={e => setHashtags(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="newpost-right">
            <div className="glass-card-static platform-section">
              <h3 className="section-label">Select Platforms</h3>
              <div className="platform-list">
                {Object.entries(platformMeta).map(([id, meta]) => {
                  const connected = connectedPlatformIds.includes(id);
                  const IconComp = meta.icon;
                  return (
                    <label key={id} className={`platform-item ${selectedPlatforms.includes(id) ? 'selected' : ''} ${!connected ? 'disabled' : ''}`}>
                      <input type="checkbox" checked={selectedPlatforms.includes(id)}
                        onChange={() => connected && togglePlatform(id)} disabled={!connected} />
                      <IconComp size={18} />
                      <span className="platform-item-name">{meta.name}</span>
                      {!connected && <span className="badge badge-warning">Not Connected</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="glass-card-static schedule-section">
              <h3 className="section-label">Schedule</h3>
              <div className="schedule-options">
                <label className={`schedule-option ${scheduleType === 'now' ? 'active' : ''}`}>
                  <input type="radio" name="schedule" value="now" checked={scheduleType === 'now'} onChange={e => setScheduleType(e.target.value)} />
                  <Send size={16} /> <span>Post Now</span>
                </label>
                <label className={`schedule-option ${scheduleType === 'later' ? 'active' : ''}`}>
                  <input type="radio" name="schedule" value="later" checked={scheduleType === 'later'} onChange={e => setScheduleType(e.target.value)} />
                  <Clock size={16} /> <span>Schedule</span>
                </label>
              </div>
              {scheduleType === 'later' && (
                <div className="schedule-picker animate-fade-in">
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input type="date" className="input-field" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Time</label>
                    <input type="time" className="input-field" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary btn-lg w-full" onClick={handlePublish}
                disabled={submitting || !selectedFile || selectedPlatforms.length === 0}>
                {submitting
                  ? <><Loader2 size={18} className="animate-spin" /> {uploading ? 'Uploading...' : 'Processing...'}</>
                  : <><Send size={18} /> {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .alert-error { padding: var(--space-3) var(--space-4); background: var(--error-bg); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); color: var(--error-400); font-size: 0.8125rem; margin-bottom: var(--space-4); }
        .alert-success { padding: var(--space-3) var(--space-4); background: var(--success-bg); border: 1px solid rgba(34,197,94,0.3); border-radius: var(--radius-md); color: var(--success-400); font-size: 0.8125rem; margin-bottom: var(--space-4); }
        .newpost-grid { display: grid; grid-template-columns: 1fr 380px; gap: var(--space-6); }
        .newpost-left, .newpost-right { display: flex; flex-direction: column; gap: var(--space-5); }
        .section-label { font-size: 0.9375rem; font-weight: 600; margin-bottom: var(--space-4); }
        .section-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
        .section-label-row .section-label { margin-bottom: 0; }
        .toggle-row { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; }
        .upload-section, .caption-section, .platform-section, .schedule-section { padding: var(--space-6); }
        .caption-section { display: flex; flex-direction: column; gap: var(--space-5); }
        .caption-section .section-label-row { margin-bottom: 0; }
        .upload-zone { border: 2px dashed var(--glass-border); border-radius: var(--radius-lg); padding: var(--space-10) var(--space-6); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-base); text-align: center; }
        .upload-zone:hover, .upload-zone.drag-over { border-color: var(--primary-500); background: rgba(124, 58, 237, 0.05); }
        .upload-zone.has-file { padding: var(--space-4); cursor: default; }
        .upload-zone-icon { width: 64px; height: 64px; border-radius: var(--radius-xl); background: rgba(124, 58, 237, 0.1); display: flex; align-items: center; justify-content: center; color: var(--primary-400); margin-bottom: var(--space-4); }
        .upload-zone-text { font-size: 0.9375rem; color: var(--text-secondary); }
        .upload-zone-text span { color: var(--primary-400); font-weight: 600; }
        .upload-zone-hint { font-size: 0.75rem; color: var(--text-tertiary); margin-top: var(--space-2); }
        .uploaded-file { display: flex; align-items: center; gap: var(--space-4); width: 100%; }
        .uploaded-file-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.1); display: flex; align-items: center; justify-content: center; color: var(--primary-400); }
        .uploaded-file-info { flex: 1; display: flex; flex-direction: column; }
        .uploaded-file-name { font-size: 0.875rem; font-weight: 600; }
        .uploaded-file-size { font-size: 0.75rem; color: var(--text-tertiary); }
        .platform-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .platform-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); color: var(--text-secondary); }
        .platform-item:hover { background: var(--glass-bg); }
        .platform-item.selected { background: rgba(124, 58, 237, 0.08); color: var(--text-primary); }
        .platform-item.disabled { opacity: 0.5; cursor: not-allowed; }
        .platform-item input { accent-color: var(--primary-500); }
        .platform-item-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
        .schedule-options { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
        .schedule-option { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-3); border-radius: var(--radius-md); background: var(--glass-bg); border: 1px solid var(--glass-border); cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); transition: all var(--transition-fast); }
        .schedule-option input { display: none; }
        .schedule-option.active { background: rgba(124, 58, 237, 0.12); border-color: var(--primary-500); color: var(--primary-400); }
        .schedule-picker { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
        .action-buttons { display: flex; flex-direction: column; gap: var(--space-3); }
        @media (max-width: 1024px) { .newpost-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
