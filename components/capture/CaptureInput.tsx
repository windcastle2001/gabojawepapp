'use client';
import { useState } from 'react';
import { Link, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';

const MAX_LENGTH = 2000;

// Gemini C: 글자 수 카운터 색상 3단계 분기
function getCounterClass(length: number): string {
  if (length >= 1900) return 'text-red-500';      // 위험: 1900~2000
  if (length >= 1800) return 'text-orange-500';   // 주의: 1800~1899
  return 'text-gray-300';                          // 기본: 100~1799
}

export function CaptureInput() {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isUrl = value.startsWith('http://') || value.startsWith('https://');
  const isOverLimit = value.length > MAX_LENGTH;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next.length <= MAX_LENGTH) {
      setValue(next);
    }
  };

  const handleSubmit = () => {
    if (isOverLimit || !value.trim()) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000); // mock
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-1">
            {isUrl ? <Link className="w-4 h-4 text-brand" aria-hidden /> : <FileText className="w-4 h-4 text-brand" aria-hidden />}
          </div>
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={'카톡에서 본 거 그냥 붙여넣어 보세요\n링크, 장소명, 텍스트 뭐든 OK'}
            className="flex-1 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none bg-transparent min-h-[72px]"
            rows={3}
            maxLength={MAX_LENGTH}
            aria-label="캡처 입력창"
            aria-describedby={value.length >= 100 ? 'capture-char-count' : undefined}
          />
        </div>
        {value.length >= 100 && (
          <p
            id="capture-char-count"
            className={cn(
              'text-right text-[10px] mt-1 tabular-nums',
              getCounterClass(value.length)
            )}
          >
            {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </p>
        )}
      </div>
      {value.trim() && (
        <div className="px-4 pb-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isOverLimit}
            aria-label={isLoading ? '분석 중' : isUrl ? '링크 저장' : '텍스트 저장'}
            isLoading={isLoading}
            className="active:scale-95"
          >
            {isLoading ? '분석 중...' : isUrl ? '링크 저장' : '텍스트 저장'}
          </Button>
        </div>
      )}
    </Card>
  );
}
