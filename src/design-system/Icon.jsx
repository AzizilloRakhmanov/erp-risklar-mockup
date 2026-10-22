/*
 * Ikona — Material Design Icons yo'llari (@mdi/js).
 *
 * Shrift emas, SVG yo'l: faqat ishlatilgan ikonalar bundle'ga tushadi.
 * Ishlatish:
 *   import { mdiWarehouse } from '@mdi/js';
 *   <Icon path={mdiWarehouse} />
 */
export default function Icon({ path, size = 16, color, title, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color || 'currentColor'}
      style={{ flex: 'none', display: 'block', ...style }}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <path d={path} />
    </svg>
  );
}
