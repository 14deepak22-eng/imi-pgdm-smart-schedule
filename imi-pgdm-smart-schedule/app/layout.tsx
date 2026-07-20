import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ScheduleProvider } from '@/components/providers/ScheduleProvider';
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration';
import { YearGate } from '@/components/onboarding/YearGate';
import './globals.css';

const display = Big_Shoulders({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const sans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'IMI PGDM Smart Schedule',
  description: 'Live class schedule, countdowns, and events for IMI PGDM batches.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Smart Schedule',
  },
};

export const viewport: Viewport = {
  themeColor: '#12141C',
  width: 'device-width',
  initialScale: 1,
};

// Runs before paint to apply the saved theme and avoid a light/dark flash.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <ServiceWorkerRegistration />
        <ScheduleProvider>
          <YearGate>{children}</YearGate>
        </ScheduleProvider>
      </body>
    </html>
  );
}
