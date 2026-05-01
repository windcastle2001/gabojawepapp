import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_FLASH_MODEL } from '@/lib/ai/model';

type PlanRequest = {
  message?: string;
  groupType?: 'couple' | 'friends';
  wishlist?: Array<{
    title: string;
    category: string;
    address?: string | null;
    tags?: string[];
    completed?: boolean;
  }>;
  communityPlaces?: Array<{
    title: string;
    category: string;
    address?: string | null;
    rating?: number;
    reviewCount?: number;
  }>;
};

function buildFallbackPlan(input: PlanRequest) {
  const candidates = [...(input.wishlist ?? []), ...(input.communityPlaces ?? [])].slice(0, 3);
  const lines = candidates.length
    ? candidates.map((place, index) => `${index + 1}. ${place.title} (${place.category})`).join('\n')
    : '1. 성수 카페 거리\n2. 서울숲 산책\n3. 근처 맛집 마무리';

  return `좋아요. 지금 저장된 장소를 기준으로 가볍게 짜보면 이렇게 가면 좋아요.\n\n${lines}\n\n이동 동선은 가까운 곳끼리 묶고, 예산이나 분위기를 알려주면 더 정확하게 다시 짜줄게요.`;
}

function buildPrompt(input: PlanRequest) {
  const wishlist = JSON.stringify((input.wishlist ?? []).slice(0, 20), null, 2);
  const community = JSON.stringify((input.communityPlaces ?? []).slice(0, 20), null, 2);

  return `너는 한국어 데이트/모임 플래너야. 앱 이름은 "가자고"이고, 사용자는 ${
    input.groupType === 'friends' ? '친구 모임' : '커플'
  } 모드로 쓰고 있어.

사용자의 요청:
${input.message ?? '오늘 갈 만한 코스를 추천해줘'}

위시리스트 후보:
${wishlist}

커뮤니티 지도 후보:
${community}

규칙:
- 한국어로 자연스럽게 답한다.
- 실제로 저장된 후보를 우선 사용한다.
- 장소가 부족하면 "추가로 검색하면 좋을 곳"을 따로 제안한다.
- 2~4단계 코스로 시간대, 이동 이유, 예산 힌트를 같이 준다.
- 너무 장황하게 쓰지 말고 바로 실행 가능한 플랜으로 답한다.`;
}

export async function POST(request: Request) {
  let input: PlanRequest;
  try {
    input = (await request.json()) as PlanRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ plan: buildFallbackPlan(input), source: 'fallback' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH_MODEL,
      generationConfig: {
        temperature: 0.6,
      },
    });

    const result = await model.generateContent(buildPrompt(input));
    const plan = result.response.text().trim();
    return NextResponse.json({ plan: plan || buildFallbackPlan(input), source: 'gemini' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ plan: buildFallbackPlan(input), source: 'fallback' });
  }
}
