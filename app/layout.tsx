import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AI Trading Manager',
  description: 'Application autonome de gestion de portefeuille boursier Multi-IA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Trading',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" style={{ backgroundColor: '#090d16', color: '#f1f5f9' }}>
      <head>
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/192/bullish.png" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#090d16',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
