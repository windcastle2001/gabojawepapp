import { MapPin, Youtube, Instagram, Globe, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';
import { Badge, Card } from '@/components/ui';

const categoryColors: Record<string, string> = {
  '카페': 'bg-warning/15 text-[#7A4A10]',
  '음식': 'bg-brand/10 text-brand',
  '장소': 'bg-success/10 text-success',
  '여행': 'bg-secondary/10 text-secondary',
  '선물': 'bg-dm-orange-light text-[#7A4A10]',
  '기타': 'bg-muted text-muted-foreground',
};

const sourceIcons: Record<string, ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  naver_blog: Globe,
  kakao_map: MapPin,
  naver_map: MapPin,
  google_map: Map,
};

interface WishlistCardProps {
  item: {
    id: string;
    title: string;
    category: string;
    address?: string;
    source_type?: string;
    thumbnail_url?: string | null;
    added_by_me?: boolean;
  };
}

export function WishlistCard({ item }: WishlistCardProps) {
  const SourceIcon: ElementType = item.source_type ? (sourceIcons[item.source_type] ?? Globe) : Globe;
  const catColor = categoryColors[item.category] ?? categoryColors['기타'];

  return (
    <Card className="p-4 flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer">
      {/* 썸네일 영역 */}
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <SourceIcon className="w-6 h-6 text-muted-foreground" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={cn(catColor)}>
            {item.category}
          </Badge>
          {!item.added_by_me && (
            <span className="text-[10px] text-brand font-medium">♥ 상대방</span>
          )}
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
        {item.address && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" /> {item.address}
          </p>
        )}
      </div>
    </Card>
  );
}
