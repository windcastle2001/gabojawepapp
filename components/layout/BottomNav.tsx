'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/app', icon: Home, label: '홈' },
  { href: '/app/wishlist', icon: Heart, label: '위시' },
  { href: '/app/map', icon: MapPin, label: '지도' },
  { href: '/app/ai', icon: Sparkles, label: 'AI' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-2"
              aria-label={label}
            >
              <Icon
                className={cn('w-5 h-5 transition-colors', isActive ? 'text-brand' : 'text-muted-foreground')}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn('text-[10px] font-medium transition-colors', isActive ? 'text-brand' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
