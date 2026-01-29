'use client';

import OptimizedImage from './OptimizedImage';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-orange-400 to-orange-600',
    'from-teal-400 to-teal-600',
    'from-indigo-400 to-indigo-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  showBorder = true 
}: AvatarProps) {
  const sizePx = sizeMap[size];
  const initials = getInitials(name);
  const gradient = getColorFromName(name);

  if (src) {
    return (
      <div 
        className={`relative ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        <OptimizedImage
          src={src}
          alt={`Foto de ${name}`}
          width={sizePx}
          height={sizePx}
          className={`rounded-full object-cover ${
            showBorder ? 'border-2 border-green-200' : ''
          } shadow-md ${className}`}
        />
      </div>
    );
  }

  // Fallback: Iniciais com gradiente
  return (
    <div
      className={`relative rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md ${
        showBorder ? 'border-2 border-white' : ''
      } ${className}`}
      style={{ 
        width: sizePx, 
        height: sizePx,
        fontSize: sizePx * 0.35,
      }}
      aria-label={`Avatar de ${name}`}
    >
      <span>{initials}</span>
    </div>
  );
}
