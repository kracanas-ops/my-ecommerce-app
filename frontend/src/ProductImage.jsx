import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getProductImage } from './productImage';

export default function ProductImage({ product, className = '', sizes = '100vw', priority = false }) {
  const [failed, setFailed] = useState(false);
  const src = getProductImage(product);

  if (!src || failed) {
    return (
      <span className={`flex items-center justify-center bg-gradient-to-br from-white/10 via-zinc-900/70 to-violet-950/60 text-white/45 ${className}`} aria-label={`No image available for ${product.name}`} role="img">
        <ImageOff size={28} strokeWidth={1.3} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      className={className}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  );
}
