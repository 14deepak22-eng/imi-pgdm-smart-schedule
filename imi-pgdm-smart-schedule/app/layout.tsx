import type { Metadata, Viewport } from 'next';
import {
  Big_Shoulders,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { ScheduleProvider } from '@/components/providers/ScheduleProvider';
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration';
import { YearGate } from '@/components/onboarding/YearGate';
import { AnnouncementModal } from '@/components/shared/AnnouncementModal';
import { InstallPrompt } from '@/components/shared/InstallPrompt';

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

const siteUrl = 'https://imi-pgdm-smart-schedule-iota.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: 'IMI PGDM Smart Schedule',
    template: '%s | IMI PGDM Smart Schedule',
  },

  description:
    'IMI PGDM Smart Schedule helps IMI Bhubaneswar PGDM students access live class schedules, next class countdowns, events, and personalized subject timetables synced automatically.',

  keywords: [
    'IMI PGDM Smart Schedule',
    'IMI Bhubaneswar',
    'IMI timetable',
    'IMI class schedule',
    'IMI routine',
    'IMI PGDM timetable',
    'IMI schedule',
    'PGDM timetable',
    'College timetable',
    'Class countdown',
    'Student timetable',
    'IMI smart schedule',
  ],

  authors: [
    {
      name: 'Deepak Kumar',
    },
  ],

  creator: 'Deepak Kumar',

  publisher: 'IMI PGDM Smart Schedule',

  category: 'Education',

  applicationName: 'IMI PGDM Smart Schedule',

  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  manifest: '/manifest.json',

  verification: {
    google: 'SB3vIIW0Wdbawt4FR69oDOvIeXzwRdvQvBRq5ceDbrA',
  },

  openGraph: {
    title: 'IMI PGDM Smart Schedule',
    description:
      'Live timetable, class countdowns, events, and personalized schedules for IMI PGDM students.',

    url: siteUrl,

    siteName: 'IMI PGDM Smart Schedule',

    locale: 'en_US',

    type: 'website',

    images: [
      {
        url: '/icons/icon-512-v2.png',
        width: 512,
        height: 512,
        alt: 'IMI PGDM Smart Schedule',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'IMI PGDM Smart Schedule',
    description:
      'Live timetable, countdowns, events, and personalized schedules for IMI Bhubaneswar PGDM students.',

    images: ['/icons/icon-512-v2.png'],
  },

  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/icons/icon-192-v2.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512-v2.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],

    apple: '/icons/apple-touch-icon-v2.png',
  },

  appleWebApp: {
    capable: true,
    title: 'Smart Schedule',
    statusBarStyle: 'black-translucent',
  },

  referrer: 'origin-when-cross-origin',
};

export const viewport: Viewport = {
  themeColor: '#12141C',
  width: 'device-width',
  initialScale: 1,
};

const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>

      <body className="h-full">
        <ScheduleProvider>
          <YearGate>
            {children}
            <AnnouncementModal />
            <InstallPrompt />
          </YearGate>
        </ScheduleProvider>

        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
