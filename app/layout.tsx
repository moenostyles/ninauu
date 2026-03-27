import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'
import SwRegister from '@/components/SwRegister'

const APP_URL = 'https://ninauu.vercel.app'
const OG_DESCRIPTION =
  'Track your hiking gear weight, build packing lists, and optimize your base weight. Free ultralight gear management tool with 900+ gear database.'

export const metadata: Metadata = {
  title: 'Ninauu — Ultralight Gear Manager',
  description: OG_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: { canonical: APP_URL },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ninauu — Ultralight Gear Manager',
    description: OG_DESCRIPTION,
    url: APP_URL,
    siteName: 'Ninauu',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ninauu — Ultralight Gear Manager' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ninauu — Ultralight Gear Manager',
    description: OG_DESCRIPTION,
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ninauu',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1C1C1E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fafaf8] min-h-screen">
        <Providers>
          <SwRegister />
          <Header />
          <main className="max-w-2xl mx-auto px-4 pt-0 pb-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
