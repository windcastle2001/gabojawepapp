import { NextResponse } from 'next/server';

function toCategoryLabel(category: string) {
  if (category.includes('카페')) return '카페';
  if (category.includes('음식') || category.includes('식당') || category.includes('맛집')) return '맛집';
  if (category.includes('공원') || category.includes('관광') || category.includes('문화')) return '산책';
  return '액티비티';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.message ?? '카카오 장소 검색에 실패했습니다.' }, { status: response.status });
  }

  return NextResponse.json({
    results: (data.documents ?? []).map((item: any) => ({
      id: item.id,
      title: item.place_name,
      category: toCategoryLabel(item.category_name ?? ''),
      address: item.road_address_name || item.address_name,
      lat: Number(item.y),
      lng: Number(item.x),
      sourceUrl: item.place_url,
    })),
  });
}
