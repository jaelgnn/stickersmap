export function Logo() {
  return (
    <img
      src="/logo.svg"
      alt="Logo StickerMap"
      className="w-60 h-auto object-contain filter brightness-110 contrast-90"
      style={{ filter: 'brightness(1.1) contrast(0.9) opacity(0.8)' }}
    />
  );
}