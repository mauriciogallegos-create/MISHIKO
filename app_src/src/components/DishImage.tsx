import React, { useState } from 'react';
import { Utensils } from 'lucide-react';

interface DishImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const DishImage: React.FC<DishImageProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900 text-stone-500 dark:text-stone-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-6 h-6 mb-1.5 opacity-60" />
        <span className="text-xs font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
