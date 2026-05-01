import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_FLASH_MODEL } from '@/lib/ai/model';

type AiMode = 'plan' | 'wishlist';

type PlaceInput = {
  title: string;
  category: string;
  address?: string | null;
  tags?: string[];
  completed?: boolean;
  rating?: number;
  reviewCount?: number;
};

type PlanRequest = {
  mode?: AiMode;
  message?: string;
  groupType?: 'couple' | 'friends' | null;
  wishlist?: PlaceInput[];
  communityPlaces?: PlaceInput[];
};

type Diagnostic = {
  level: 'info' | 'warning' | 'error';
  message: string;
};

function normalizeMode(mode: PlanRequest['mode']): AiMode {
  return mode === 'wishlist' ? 'wishlist' : 'plan';
}

function activeWishlist(input: PlanRequest) {
  return (input.wishlist ?? []).filter((place) => !place.completed).slice(0, 12);
}

function topCommunity(input: PlanRequest) {
  return [...(input.communityPlaces ?? [])]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 8);
}

function compactPlace(place: PlaceInput) {
  return {
    title: place.title,
    category: place.category,
    address: place.address ?? null,
    tags: place.tags?.slice(0, 5) ?? [],
    completed: Boolean(place.completed),
    rating: place.rating ?? null,
    reviewCount: place.reviewCount ?? null,
  };
}

function formatPlace(place: PlaceInput, index: number) {
  const address = place.address ? ` - ${place.address}` : '';
  const tags = place.tags?.length ? ` #${place.tags.slice(0, 3).join(' #')}` : '';
  return `${index + 1}. ${place.title} (${place.category})${address}${tags}`;
}

function buildFallbackPlan(input: PlanRequest, mode: AiMode) {
  const wishlist = activeWishlist(input);
  const community = topCommunity(input);
  const primary = wishlist.length ? wishlist : community;

  if (!primary.length) {
    return [
      '아직 추천에 쓸 장소가 부족해요.',
      '',
      '1. 위시리스트에 카페, 맛집, 산책 장소를 3개 이상 저장해 주세요.',
      '2. 카카오맵 검색이나 링크 정리로 장소를 추가하면 추천 품질이 좋아져요.',
      '3. 예산, 지역, 분위기를 같이 알려주면 더 정확하게 짤 수 있어요.',
    ].join('\n');
  }

  if (mode === 'wishlist') {
    return [
      '지금 위시리스트에서 먼저 고르기 좋은 후보예요.',
      '',
      ...primary.slice(0, 4).map(formatPlace),
      '',
      '기준: 아직 완료하지 않은 장소, 주소가 있는 장소, 카테고리가 겹치지 않는 장소를 우선 골랐어요.',
    ].join('\n');
  }

  return [
    '저장된 장소를 기준으로 바로 실행 가능한 코스를 짜봤어요.',
    '',
    ...primary.slice(0, 3).map(formatPlace),
    '',
    '팁: 이동 시간을 줄이려면 같은 지역의 장소끼리 묶고, 마지막은 식사나 오래 머물 수 있는 곳으로 잡는 게 좋아요.',
  ].join('\n');
}

function buildPrompt(input: PlanRequest, mode: AiMode) {
  const groupLabel = input.groupType === 'friends' ? '친구 모임' : '커플';
  const wishlist = JSON.stringify(activeWishlist(input).map(compactPlace), null, 2);
  const community = JSON.stringify(topCommunity(input).map(compactPlace), null, 2);
  const userMessage = input.message?.trim() || '오늘 바로 실행할 수 있는 코스를 추천해줘.';

  const goal =
    mode === 'wishlist'
      ? '위시리스트에서 지금 고르기 좋은 후보를 3~5개 추천한다.'
      : '2~4단계의 실행 가능한 데이트/모임 코스를 만든다.';

  return `너는 한국어 데이트/모임 플래너다. 앱 이름은 "가자고"다.
모델은 비용 통제를 위해 ${GEMINI_FLASH_MODEL}만 사용한다.

사용자 모드: ${groupLabel}
요청: ${userMessage}
목표: ${goal}

위시리스트:
${wishlist}

커뮤니티 인기 장소:
${community}

응답 규칙:
- 한국어로 자연스럽고 짧게 답한다.
- 저장된 위시리스트 장소를 최우선으로 사용한다.
- 부족할 때만 커뮤니티 장소를 보조로 쓴다.
- 없는 영업시간, 가격, 정확한 거리 정보는 지어내지 않는다.
- 각 추천에는 왜 좋은지, 다음에 붙이면 좋은 장소, 주의할 점을 포함한다.
- 바로 복사해서 공유할 수 있는 마크다운 목록으로 답한다.`;
}

export async function POST(request: Request) {
  let input: PlanRequest;
  try {
    input = (await request.json()) as PlanRequest;
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid JSON',
        diagnostics: [{ level: 'error', message: '요청 JSON을 읽지 못했습니다.' }],
      },
      { status: 400 }
    );
  }

  const mode = normalizeMode(input.mode);
  const diagnostics: Diagnostic[] = [];
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    diagnostics.push({
      level: 'warning',
      message: 'GEMINI_API_KEY가 없어 안전한 로컬 추천으로 응답했습니다.',
    });
    return NextResponse.json({
      plan: buildFallbackPlan(input, mode),
      source: 'fallback',
      model: GEMINI_FLASH_MODEL,
      diagnostics,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH_MODEL,
      generationConfig: {
        temperature: mode === 'wishlist' ? 0.45 : 0.6,
      },
    });

    const result = await model.generateContent(buildPrompt(input, mode));
    const plan = result.response.text().trim();

    if (!plan) {
      diagnostics.push({
        level: 'warning',
        message: 'Gemini 응답이 비어 있어 로컬 추천으로 대체했습니다.',
      });
    }

    return NextResponse.json({
      plan: plan || buildFallbackPlan(input, mode),
      source: plan ? 'gemini' : 'fallback',
      model: GEMINI_FLASH_MODEL,
      diagnostics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    console.error('[api/ai/plan] Gemini request failed:', message);
    diagnostics.push({
      level: 'error',
      message: `Gemini 호출 실패: ${message}`,
    });

    return NextResponse.json({
      plan: buildFallbackPlan(input, mode),
      source: 'fallback',
      model: GEMINI_FLASH_MODEL,
      diagnostics,
    });
  }
}
