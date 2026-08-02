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
const siteName = "IMI Smart Schedule";
const logoUrl = `${siteUrl}/icons/icon-512-v2.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

 title: {
  default: "IMI Smart Schedule | PGDM Timetable - IMI Bhubaneswar",
  template: "%s | IMI Smart Schedule",
},

  description:
    'description:
"Access your personalized IMI Bhubaneswar PGDM timetable with live class schedules, next class countdown, events, notices, and automatic Google Sheet updates. Fast, mobile-friendly, and always up to date.",',

  keywords: [
    'IMI Smart Schedule',
    'Imi Smart Schedule',
    'imi Smart Schedule',
    'IMI PGDM Smart Schedule',
    'Imi PGDM Smart Schedule',
    'imi PGDM Smart Schedule',
    'IMI Bhubaneswar',
    'IMI timetable',
    'imi timetable',
    'IMI class schedule',
    'IMI routine',
    'IMI PGDM timetable',
    'IMI schedule',
    'PGDM timetable',
    'College timetable',
    'Class countdown',
    'Student timetable',
    'timetable',
    'IMI Delhi',
    'IMI kolkata ',
    'imi Smart Schedule',
    'imi Schedule',
    'Imi Student timetable',
    'imi Student',
    'IMI pgdm Smart Schedule',
    'IMI',
    'IMI',
  ],

  authors: [
    {
      name: 'Deepak Kumar',
    },
  ],

  creator: 'Deepak Kumar',

  publisher: siteName,

  category: 'Education',

  applicationName: siteName,

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
    title: "IMI Smart Schedule | PGDM Timetable - IMI Bhubaneswar",
    description:
      'description:
"Live class schedules, next class countdown, events and personalized timetable for IMI Bhubaneswar PGDM students.",

    url: siteUrl,

    siteName,

    locale: 'en_US',

    type: 'website',

    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: "IMI Smart Schedule | PGDM Timetable - IMI Bhubaneswar",
    description:
      'Live timetable, countdowns, events, and personalized schedules for IMI Bhubaneswar PGDM students.',

    images: ['/og-image.png'],
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
    title: "IMI Smart Schedule | PGDM Timetable - IMI Bhubaneswar",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalApplication",
  applicationSubCategory: "Student Timetable",

offers: {
  "@type": "Offer",
  price: "0",
  priceCurrency: "INR",
},
  name: siteName,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  url: siteUrl,
  description:
    "Live timetable, class countdowns, events and personalized schedules for IMI Bhubaneswar PGDM students.",
  image: logoUrl,
  inLanguage: "en",

  creator: {
    "@type": "Person",
    name: "Deepak Kumar",
  },

  publisher: {
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: logoUrl,
  },
};

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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
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
