import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'WildQuest',
  description: 'Chat • Collect • Play • Learn',
  generator: 'v0.app',
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
  themeColor: "#4CAF50",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WildQuest"
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WildQuest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4CAF50" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}

 /* Mobile optimization */
@media (max-width: 768px) {
  body {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
