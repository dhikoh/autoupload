import '../styles/globals.css';

export const metadata = {
  title: 'AutoPost Hub — Upload Once, Post Everywhere',
  description: 'Social media auto-uploader. Upload your content once and automatically publish to YouTube, Instagram, TikTok, Facebook, X, and Threads from one dashboard.',
  keywords: 'social media, auto upload, scheduler, YouTube, Instagram, TikTok, Facebook',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        {children}
      </body>
    </html>
  );
}
