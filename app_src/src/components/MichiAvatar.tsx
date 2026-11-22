import React from 'react';
import { Bell, ChefHat, Crown, Sparkles } from 'lucide-react';
import { IMAGES } from '../data/mishikoSeed';
import { FurColor, MichiConfig, MichiOutfit } from '../types/mishiko';
import { DishImage } from './DishImage';

interface MichiAvatarProps {
  config: MichiConfig;
  size?: 'sm' | 'md' | 'lg';
  isAnimating?: boolean;
  showBadge?: boolean;
}

const FUR_RING_STYLES: Record<FurColor, { ring: string; filter: string; badgeBg: string }> = {
  Naranja: {
    ring: 'ring-amber-400/80 bg-amber-100 dark:bg-amber-950/50',
    filter: 'saturate-105',
    badgeBg: 'bg-[#9E3304] text-white',
  },
  Blanco: {
    ring: 'ring-stone-200 dark:ring-stone-600 bg-stone-50 dark:bg-stone-800',
    filter: 'brightness-110 saturate-50 contrast-95',
    badgeBg: 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900',
  },
  Gris: {
    ring: 'ring-slate-400/80 bg-slate-100 dark:bg-slate-800',
    filter: 'grayscale-[65%] contrast-105',
    badgeBg: 'bg-slate-700 text-white',
  },
  Esmoquin: {
    ring: 'ring-zinc-900 dark:ring-zinc-500 bg-zinc-900',
    filter: 'grayscale-[85%] contrast-125 brightness-95',
    badgeBg: 'bg-zinc-900 text-white',
  },
};

const OUTFIT_ICON: Record<MichiOutfit, React.ReactNode> = {
  Corbatín: <Sparkles className="w-3 h-3" />,
  Delantal: <ChefHat className="w-3 h-3" />,
  Sombrero: <Crown className="w-3 h-3" />,
  Campanilla: <Bell className="w-3 h-3" />,
};

const OUTFIT_LABEL: Record<MichiOutfit, string> = {
  Corbatín: 'Corbatín Elegante',
  Delantal: 'Delantal Maestro',
  Sombrero: 'Sombrero Gourmet',
  Campanilla: 'Campanilla Oro',
};

export const MichiAvatar: React.FC<MichiAvatarProps> = ({
  config,
  size = 'md',
  isAnimating = false,
  showBadge = false,
}) => {
  const fur = FUR_RING_STYLES[config.furColor];
  const sizeClasses =
    size === 'sm'
      ? 'w-12 h-12'
      : size === 'md'
        ? 'w-16 h-16'
        : 'w-32 h-32';

  return (
    <div className="relative inline-flex flex-col items-center shrink-0">
      <div
        className={`relative rounded-full ring-4 overflow-hidden transition-transform duration-300 ${fur.ring} ${sizeClasses} ${
          isAnimating ? 'scale-105' : ''
        }`}
      >
        <DishImage
          src={IMAGES.michi}
          alt={`${config.name} mesero virtual`}
          className={`w-full h-full object-cover ${fur.filter}`}
        />
      </div>
      {showBadge && (
        <div
          className={`-mt-3 relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${fur.badgeBg}`}
        >
          {OUTFIT_ICON[config.outfit]}
          <span>{OUTFIT_LABEL[config.outfit]}</span>
        </div>
      )}
    </div>
  );
};
