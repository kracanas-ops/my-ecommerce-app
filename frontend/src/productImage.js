const fallbackImages = [
  { match: /headphone|headset|audio/i, src: '/products/wireless-headphones.jpg' },
  { match: /keyboard|keycap/i, src: '/products/mechanical-keyboard.jpg' },
  { match: /monitor|display|screen/i, src: '/products/usb-c-monitor.jpg' }
];

export function getProductImage(product) {
  const imageUrl = product?.imageUrl?.trim();
  if (imageUrl && (/^\/products\/[A-Za-z0-9][A-Za-z0-9._-]*$/i.test(imageUrl) || /^https:\/\//i.test(imageUrl))) {
    return imageUrl;
  }
  return fallbackImages.find(({ match }) => match.test(product?.name || ''))?.src || '';
}
