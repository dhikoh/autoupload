'use client';

// Custom SVG platform icons (brand icons not available in lucide-react)
function YouTubeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.8 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.8-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
    </svg>
  );
}

function FacebookIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.1c0-6.6-5.4-12-12-12S0 5.5 0 12.1c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18.1 24 12.1z"/>
    </svg>
  );
}

function InstagramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.3-.1 1.6-.1 4.9-.1M12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.7-2.2 1.4C1.2 2.6.8 3.3.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c0 1.3.2 2.2.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3 0 2.2-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c0-1.3-.2-2.2-.5-2.9-.3-.8-.7-1.5-1.4-2.2-.7-.7-1.4-1.1-2.2-1.4-.8-.3-1.6-.5-2.9-.5C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.8a1.4 1.4 0 100 2.9 1.4 1.4 0 000-2.9z"/>
    </svg>
  );
}

function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.6 5.9c-1.6-.5-2.8-1.8-3.2-3.4-.1-.4-.1-.8-.1-1.2h-3.4l-.1 13.9c0 1.6-1.3 2.9-2.9 2.9-.5 0-.9-.1-1.4-.3-.9-.5-1.6-1.5-1.6-2.6 0-1.6 1.3-2.9 2.9-2.9.3 0 .6.1.9.1V9c-.3 0-.6-.1-.9-.1-3.5 0-6.3 2.8-6.3 6.3 0 2.1 1 3.9 2.6 5.1 1 .8 2.3 1.2 3.7 1.2 3.5 0 6.3-2.8 6.3-6.3V8.6c1.4 1 3 1.5 4.8 1.5V6.7c-.4 0-1.6-.2-2.3-.8z"/>
    </svg>
  );
}

function XIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 2.3h3.5l-7.6 8.7L23 21.7h-7l-5.5-7.2-6.3 7.2H.7l8.1-9.3L.4 2.3h7.2l5 6.6 5.6-6.6zm-1.2 17.4h1.9L7.1 4.3H5.1l11.9 15.4z"/>
    </svg>
  );
}

function ThreadsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.2 2c-3 0-5.2 1-6.7 2.9-1.3 1.7-2 4.2-2 7.1 0 2.9.7 5.3 2 7.1 1.5 1.9 3.7 2.9 6.7 2.9 2.1 0 3.8-.6 5.1-1.7 1.5-1.3 2.3-3.2 2.3-5.7 0-2.2-.7-3.9-2-5.1-1.2-1.1-2.8-1.6-4.7-1.6-.7 0-1.3.1-1.9.3.3-.8.8-1.4 1.4-1.8.7-.5 1.6-.7 2.6-.7h.1c1.5 0 2.8.5 3.7 1.3l1.6-2c-1.4-1.2-3.1-1.8-5.2-1.8h-.1c-1.6 0-3 .4-4.2 1.1-1.1.7-1.9 1.7-2.4 3-.1.2-.2.5-.2.7 0 0 0 .1.1.1-.2.6-.3 1.3-.4 2.1-.1.7-.1 1.4-.1 2.2 0 1.2.3 2.1.9 2.8.6.7 1.5 1.1 2.5 1.1 1 0 1.8-.3 2.4-.9.6-.6.9-1.5.9-2.5 0-1-.3-1.8-.9-2.3-.5-.5-1.2-.7-2-.7-.5 0-1 .1-1.4.3.3-.5.8-.9 1.4-1.1.4-.1.8-.2 1.2-.2 1.3 0 2.3.4 3 1.1.7.7 1.1 1.7 1.1 3.1 0 1.8-.5 3.1-1.5 4-.9.8-2.2 1.2-3.7 1.2-2.4 0-4-.8-5-2.3-.9-1.4-1.3-3.4-1.3-5.9 0-2.5.5-4.5 1.3-5.9 1-1.5 2.7-2.3 5-2.3z"/>
    </svg>
  );
}

const platformConfig = {
  youtube: { icon: YouTubeIcon, label: 'YouTube', className: 'badge-youtube' },
  facebook: { icon: FacebookIcon, label: 'Facebook', className: 'badge-facebook' },
  instagram: { icon: InstagramIcon, label: 'Instagram', className: 'badge-instagram' },
  tiktok: { icon: TikTokIcon, label: 'TikTok', className: 'badge-tiktok' },
  x: { icon: XIcon, label: 'X', className: 'badge-x' },
  threads: { icon: ThreadsIcon, label: 'Threads', className: 'badge-threads' },
};

export default function PlatformBadge({ platform, showLabel = true, size = 'md' }) {
  const p = platformConfig[platform];
  if (!p) return null;
  const Icon = p.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span className={`badge ${p.className} ${size === 'sm' ? 'badge-sm' : ''}`}>
      <Icon size={iconSize} />
      {showLabel && p.label}
    </span>
  );
}

export function PlatformIcon({ platform, size = 20 }) {
  const p = platformConfig[platform];
  if (!p) return null;
  const Icon = p.icon;
  return <Icon size={size} />;
}

export { platformConfig, YouTubeIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon, ThreadsIcon };
