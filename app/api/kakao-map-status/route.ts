import { NextResponse } from 'next/server';
import https from 'node:https';

function requestSdkStatus(appKey: string) {
  const url = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;

  return new Promise<{ statusCode: number; contentType: string; body: string }>((resolve, reject) => {
    https
      .get(url, (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          if (body.length < 2000) body += chunk;
        });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            contentType: String(response.headers['content-type'] ?? ''),
            body,
          });
        });
      })
      .on('error', reject);
  });
}

export async function GET() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();

  if (!appKey) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'missing_key',
        message: 'NEXT_PUBLIC_KAKAO_MAP_KEY is missing.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await requestSdkStatus(appKey);

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return NextResponse.json({ ok: true });
    }

    try {
      const parsed = JSON.parse(result.body) as { errorType?: string; message?: string };
      return NextResponse.json(
        {
          ok: false,
          reason: parsed.errorType ?? 'sdk_error',
          message: parsed.message ?? `Kakao SDK responded with status ${result.statusCode}.`,
          statusCode: result.statusCode,
        },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        {
          ok: false,
          reason: 'sdk_error',
          message: `Kakao SDK responded with status ${result.statusCode}.`,
          statusCode: result.statusCode,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown network error',
      },
      { status: 200 }
    );
  }
}
