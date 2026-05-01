import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NormalizedPayload } from '@/lib/adapters/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Gemini Flash를 사용해 raw 웹 콘텐츠에서 NormalizedPayload를 추출한다.
 *
 * - 모델: gemini-2.0-flash (비용 효율 + 구조화 JSON 충분)
 * - responseMimeType: application/json (마크다운 코드블록 없이 순수 JSON 반환)
 * - temperature: 0.1 (추측 최소화)
 * - 입력 최대 8000자 (컨텍스트 비용 통제)
 */
export async function extractWithGemini(
  rawContent: string,
  sourceUrl: string,
  sourceType: NormalizedPayload['source_type'],
): Promise<NormalizedPayload> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const prompt = buildPrompt(rawContent, sourceType);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let extracted: Partial<NormalizedPayload & { lat: number | null; lng: number | null; thumbnail_url: string | null }>;
  try {
    extracted = JSON.parse(text);
  } catch {
    throw new Error(`Gemini JSON 파싱 실패: ${text.slice(0, 100)}`);
  }

  return {
    title: extracted.title ?? '제목 없음',
    category: extracted.category ?? '기타',
    address: extracted.address ?? undefined,
    lat: extracted.lat ?? undefined,
    lng: extracted.lng ?? undefined,
    summary: extracted.summary ?? undefined,
    tags: extracted.tags ?? [],
    thumbnail_url: extracted.thumbnail_url ?? undefined,
    source_url: sourceUrl,
    source_type: sourceType,
  };
}

function buildPrompt(rawContent: string, sourceType: NormalizedPayload['source_type']): string {
  const sourceHint = getSourceHint(sourceType);
  return `당신은 웹 콘텐츠에서 장소/콘텐츠 정보를 추출하는 전문가입니다.
${sourceHint}

다음 콘텐츠에서 정보를 추출해 아래 JSON 스키마로 반환하세요.

스키마:
{
  "title": "장소 또는 콘텐츠 제목 (필수, 문자열)",
  "category": "음식|카페|장소|선물|여행|영상참고|기타 중 정확히 하나 (필수)",
  "address": "도로명 주소 또는 지번 주소 (없으면 null)",
  "lat": 위도 숫자 (없으면 null),
  "lng": 경도 숫자 (없으면 null),
  "summary": "150자 이내 한국어 요약 (없으면 null)",
  "tags": ["태그1", "태그2"] (없으면 빈 배열 []),
  "thumbnail_url": "대표 이미지 URL 전체 경로 (없으면 null)"
}

규칙:
- 반드시 유효한 JSON 객체만 반환 (마크다운 코드블록, 추가 텍스트 절대 금지)
- 콘텐츠에 없는 정보는 null (추측, 가정 금지)
- category는 반드시 지정된 7개 값 중 하나
- tags는 최대 5개, 2~6자 한국어 키워드

콘텐츠 (최대 8000자):
<content>
${rawContent.slice(0, 8000)}
</content>`;
}

function getSourceHint(sourceType: NormalizedPayload['source_type']): string {
  const hints: Record<NormalizedPayload['source_type'], string> = {
    kakao_map: '입력 소스: 카카오맵. 장소명, 주소, 카테고리, 좌표에 집중하세요.',
    naver_map: '입력 소스: 네이버지도. 장소명, 주소, 카테고리, 좌표에 집중하세요.',
    google_map: '입력 소스: 구글지도. RESOLVED_URL에서 장소명과 좌표를 추출하세요.',
    naver_blog: '입력 소스: 네이버블로그. BODY_TEXT에서 방문한 장소명과 주소를 추출하세요.',
    youtube: '입력 소스: 유튜브. 제목과 채널명을 기반으로 영상참고로 분류하세요.',
    instagram: '입력 소스: 인스타그램. OG 메타만 있어 정보가 제한적일 수 있습니다.',
    manual: '입력 소스: 일반 웹페이지. OG 메타와 본문에서 장소/콘텐츠 정보를 추출하세요.',
  };
  return hints[sourceType];
}
