import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { OrganizationSchema } from '@/components/Schema';
import { site } from '@/data/site';
import PlausibleProvider from 'next-plausible';

// NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL is set in Vercel env vars once the Plausible
// site is created (looks like https://plausible.io/js/pa-XXXXX.js).
// Until it is set the provider is skipped and usePlausible() calls are no-ops.
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;

function Analytics({ children }: { children: React.ReactNode }) {
  if (!PLAUSIBLE_SRC) return <>{children}</>;
  return <PlausibleProvider src={PLAUSIBLE_SRC}>{children}</PlausibleProvider>;
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Security Gates, Access Control & Surveillance — Central Florida & Tampa Bay`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  authors: [{ name: site.name }],
  generator: 'Next.js',
  keywords: [
    'security gate systems',
    'gate automation',
    'access control',
    'video surveillance',
    'security system integration',
    'commercial security Florida',
    'HOA gate access',
    'Tampa Bay security',
    'Central Florida security',
  ],
  creator: site.name,
  publisher: site.name,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Advanced Security Systems for Central Florida & Tampa Bay`,
    description: site.tagline,
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.tagline,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    // Emits <meta name="google-site-verification" content="..." /> in <head>.
    google: '6eUk_tq6HeTljucVT9bMJKri3z8eGdoXu1nXfQw48mI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <Analytics>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-fsc-accent focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <OrganizationSchema />
        </Analytics>
      </body>
    </html>
  );
}
