import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 카카오맵 썸네일
      { protocol: 'https', hostname: 'map.kakao.com' },
      { protocol: 'https', hostname: 'img1.kakaocdn.net' },
      { protocol: 'https', hostname: 't1.kakaocdn.net' },
      // 네이버 블로그 / 지도 이미지
      { protocol: 'https', hostname: 'blogfiles.pstatic.net' },
      { protocol: 'https', hostname: 'postfiles.pstatic.net' },
      { protocol: 'https', hostname: 'ldb-phinf.pstatic.net' },
      // 유튜브 썸네일
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // 인스타그램 CDN
      { protocol: 'https', hostname: 'instagram.fsel5-1.fna.fbcdn.net' },
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      // 구글 지도 / 스태틱 맵
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'maps.gstatic.com' },
      // Supabase Storage (프로젝트 전용)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
