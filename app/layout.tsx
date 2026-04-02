import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'
import SwRegister from '@/components/SwRegister'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

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
  themeColor: '#0a0a0b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Providers>
          <SwRegister />
          <Header />
          <main style={{ maxWidth: '672px', margin: '0 auto', padding: '12px 16px 24px' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
