import { isHostedPreview } from '@/lib/leads/environment';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AttributionCapture } from '@/components/AttributionCapture';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { OrganizationSchema } from '@/components/Schema';
import { site } from '@/data/site';
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/seo/canonical';
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

const jakarta = Plus_Jakarta_Sans({
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
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: `${site.name} | Gates & Access Control`,
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
    'commercial gate access control',
    'Clermont gate repair',
    'Orlando gate service',
    'Tampa Bay gate service',
  ],
  creator: site.name,
  publisher: site.name,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: canonicalUrl('/'),
    siteName: site.name,
    title: `${site.name} — Gate Repair & Access Control`,
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
    google: 'y3PS7h6o0CtYVYhts0Zt4PuD5eQPbIuaZ-XESWSjx_M',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <LocalPreviewProvider local={LOCAL_PREVIEW}>
          <AttributionCapture />
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
