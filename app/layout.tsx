import { isHostedPreview } from '@/lib/leads/environment';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { OrganizationSchema } from '@/components/Schema';
import { site } from '@/data/site';
import { LocalPreviewProvider } from '@/components/LocalPreviewContext';
import { analyticsScriptSrc } from '@/lib/analytics/config';
import { PlausibleAnalytics } from '@/lib/analytics/PlausibleAnalytics';

// NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL is set in Vercel env vars once the Plausible
// site is created (https://plausible.io/js/pa-XXXXX.js). Analytics renders only for
// that exact URL shape in a production build that is neither local nor hosted
// preview; otherwise nothing is rendered and track() calls are no-ops.
const LOCAL_PREVIEW = process.env.FSC_LOCAL_PREVIEW === '1';
const PRIVATE_PREVIEW = LOCAL_PREVIEW || isHostedPreview();
const PLAUSIBLE_SRC = analyticsScriptSrc({
  scriptUrl: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL,
  localPreview: LOCAL_PREVIEW,
  hostedPreview: isHostedPreview(),
  production: process.env.NODE_ENV === 'production',
});

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
    index: !PRIVATE_PREVIEW,
    follow: !PRIVATE_PREVIEW,
    googleBot: {
      index: !PRIVATE_PREVIEW,
      follow: !PRIVATE_PREVIEW,
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
        <LocalPreviewProvider local={LOCAL_PREVIEW}>
          {LOCAL_PREVIEW && <div className="fsc-preview-notice">Local review · Synthetic details only · Requests stay on this computer</div>}
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
          {PLAUSIBLE_SRC && <PlausibleAnalytics src={PLAUSIBLE_SRC} />}
        </LocalPreviewProvider>
      </body>
    </html>
  );
}
