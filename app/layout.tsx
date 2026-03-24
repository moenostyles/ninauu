import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Ninauu',
  description: 'Essentials, only. — UL gear manager for hikers.',
  manifest: '/manifest.json',
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
      <body className="bg-fill min-h-screen">
        <Providers>
          <Header />
          <main className="max-w-2xl mx-auto px-4 pt-3 pb-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
