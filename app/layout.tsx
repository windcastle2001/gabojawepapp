import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://gajago.kr'),
  title: {
    default: '가자고 | 같이 고르고 바로 가는 약속 지도',
    template: '%s | 가자고',
  },
  description:
    '장소를 빠르게 저장하고 커플 또는 친구들과 함께 다음 약속을 정하는 커뮤니티 지도 앱.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '가자고',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
