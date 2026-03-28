import '../styles/globals.css';

export const metadata = {
  title: 'AutoPost Hub — Upload Once, Post Everywhere',
  description: 'Social media auto-uploader. Upload your content once and automatically publish to YouTube, Instagram, TikTok, Facebook, X, and Threads from one dashboard.',
  keywords: 'social media, auto upload, scheduler, YouTube, Instagram, TikTok, Facebook',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#10101E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        {children}
      </body>
    </html>
  );
}
