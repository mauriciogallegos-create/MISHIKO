import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
  caption?: string;
  alt?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  value,
  size = 110,
  className = '',
  caption,
  alt = 'Código QR de Mesa MISHIKO',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: Math.max(256, size * 3),
      margin: 1,
      color: {
        dark: '#0f0e0d',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR Code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-stone-100 dark:bg-stone-800 animate-pulse rounded-xl border border-stone-200 dark:border-stone-700 ${className}`}
      />
    );
  }

  return (
    <div className={`relative inline-flex flex-col items-center p-2 bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
      {/* Corner scanner accents (Real Restaurant POS Scanner Framing) */}
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={dataUrl}
          alt={alt}
          className="w-full h-full object-contain select-none"
        />
        {/* Subtle high-tech scanner corners */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#9E3304] pointer-events-none" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#9E3304] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#9E3304] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#9E3304] pointer-events-none" />
      </div>

      {caption && (
        <div className="mt-1.5 text-[9px] font-mono font-bold tracking-wider text-stone-600 uppercase text-center">
          {caption}
        </div>
      )}
    </div>
  );
};
