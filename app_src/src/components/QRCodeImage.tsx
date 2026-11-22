import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
  includeLogo?: boolean;
  alt?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  value,
  size = 140,
  className = '',
  includeLogo = true,
  alt = 'Código QR de Mesa',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
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
    <div
      className={`relative inline-flex items-center justify-center bg-white p-1.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={dataUrl}
        alt={alt}
        className="w-full h-full object-contain rounded-lg"
      />
      {includeLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white shadow-md border border-amber-300 flex items-center justify-center">
            <span className="text-sm select-none">🐱</span>
          </div>
        </div>
      )}
    </div>
  );
};
