import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TypeForge — Elite Typing Experience",
  description: "The world's most immersive typing practice platform. Master your typing speed and accuracy with 100 progressive levels, real-time multiplayer, and intelligent learning systems.",
  keywords: "typing practice, WPM, typing speed, typing test, learn typing, multiplayer typing",
  openGraph: {
    title: "TypeForge — Elite Typing Experience",
    description: "Master typing with cinematic animations and real-time competition.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(13, 17, 23, 0.95)',
              color: '#f0f4ff',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#00ff88', secondary: '#080b14' },
            },
            error: {
              iconTheme: { primary: '#ff3d6b', secondary: '#080b14' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
