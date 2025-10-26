/**
 * CardWrapper - Base wrapper for all configurable cards
 *
 * Provides consistent sizing, styling, and layout for all card variants
 */

import { type ReactNode } from 'react';
import { type CardSize, getWidthClass, getHeightClass } from '@/types/card-config';

interface CardWrapperProps {
  size: CardSize;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function CardWrapper({ size, title, children, className = '' }: CardWrapperProps) {
  const widthClass = getWidthClass(size.width);
  const heightClass = getHeightClass(size.height);

  return (
    <div
      className={`
        weather-card
        ${widthClass}
        ${heightClass}
        flex flex-col
        ${className}
      `}
    >
      {title && (
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">
          {title}
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
