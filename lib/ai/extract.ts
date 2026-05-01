import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_FLASH_MODEL } from '@/lib/ai/model';
import type { NormalizedPayload } from '@/lib/adapters/types';

type GeminiExtractResponse = Partial<
  Omit<NormalizedPayload, 'source_url' | 'source_type'> & {
    lat: number | null;
    lng: number | null;
    thumbnail_url: string | null;
  }
>;

const FALLBACK_CATEGORY: NormalizedPayload['category'] = '기타';
const ALLOWED_CATEGORIES = ['맛집', '카페', '산책', '액티비티', '여행', '영상참고', '기타'] as const;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

function normalizeCategory(category: unknown): NormalizedPayload['category'] {
  if (typeof category === 'string' && ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
    return category as NormalizedPayload['category'];
  }
  return FALLBACK_CATEGORY;
}

export async function extractWithGemini(
  rawContent: string,
  sourceUrl: string,
  sourceType: NormalizedPayload['source_type'],
): Promise<NormalizedPayload> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_FLASH_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const result = await model.generateContent(buildPrompt(rawContent, sourceType));
  const text = result.response.text();

  let extracted: GeminiExtractResponse;
  try {
    extracted = JSON.parse(text) as GeminiExtractResponse;
  } catch {
    throw new Error(`Gemini JSON parsing failed: ${text.slice(0, 120)}`);
  }

  return {
    title: typeof extracted.title === 'string' && extracted.title.trim() ? extracted.title.trim() : '제목 없음',
    category: normalizeCategory(extracted.category),
    address: extracted.address ?? undefined,
    lat: extracted.lat ?? undefined,
    lng: extracted.lng ?? undefined,
    summary: extracted.summary ?? undefined,
    tags: Array.isArray(extracted.tags) ? extracted.tags.slice(0, 5) : [],
    thumbnail_url: extracted.thumbnail_url ?? undefined,
    source_url: sourceUrl,
    source_type: sourceType,
  };
}

function buildPrompt(rawContent: string, sourceType: NormalizedPayload['source_type']): string {
  return `너는 링크와 페이지 본문에서 데이트/모임 장소 정보를 추출하는 한국어 정보 정리 도우미다.
입력 출처: ${getSourceHint(sourceType)}

아래 JSON 스키마로만 답한다.
{
  "title": "장소명 또는 콘텐츠 제목",
  "category": "맛집|카페|산책|액티비티|여행|영상참고|기타 중 하나",
  "address": "도로명/지번 주소, 없으면 null",
  "lat": "위도 숫자, 없으면 null",
  "lng": "경도 숫자, 없으면 null",
  "summary": "150자 이내 한국어 요약, 없으면 null",
  "tags": ["2~6자 한국어 태그 최대 5개"],
  "thumbnail_url": "대표 이미지 URL, 없으면 null"
}

규칙:
- 유효한 JSON 객체만 반환한다. 마크다운 코드블록이나 설명 문장을 붙이지 않는다.
- 본문에 없는 주소, 좌표, 영업시간, 가격은 추측하지 않는다.
- 링크가 장소가 아닌 영상/블로그 참고자료면 category를 "영상참고" 또는 "기타"로 둔다.
- 한국어로 정리한다.

콘텐츠:
<content>
${rawContent.slice(0, 8000)}
</content>`;
}

function getSourceHint(sourceType: NormalizedPayload['source_type']): string {
  const hints: Record<NormalizedPayload['source_type'], string> = {
    kakao_map: '카카오맵',
    naver_map: '네이버 지도',
    google_map: 'Google Maps',
    naver_blog: '네이버 블로그',
    youtube: 'YouTube',
    instagram: 'Instagram',
    manual: '일반 웹페이지',
  };
  return hints[sourceType];
}
