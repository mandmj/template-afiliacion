/**
 * Construcción de deep-links de Awin.
 *
 * Formato estándar:
 *   https://www.awin1.com/cread.php?awinmid=<MID>&awinaffid=<PUB>&ued=<URL-encoded-target>&clickref=<opcional>
 *
 * - <MID>: Merchant ID único del anunciante (lo da Awin al aprobarte un programa).
 * - <PUB>: Publisher ID de tu cuenta ({{AWIN_PUBLISHER_ID}} para esta web).
 * - <target>: URL final del producto en la tienda, URL-encoded.
 * - <clickref>: parámetro de tracking opcional (p. ej. slug de la review).
 */

export interface AwinLinkOptions {
  merchantId: string | number;
  targetUrl: string;
  clickRef?: string;
  publisherId?: string;
}

export function buildAwinUrl({
  merchantId,
  targetUrl,
  clickRef,
  publisherId,
}: AwinLinkOptions): string {
  const pub = publisherId || import.meta.env.AWIN_PUBLISHER_ID || '{{AWIN_PUBLISHER_ID}}';
  const params = new URLSearchParams({
    awinmid: String(merchantId),
    awinaffid: String(pub),
    ued: targetUrl,
  });
  if (clickRef) params.set('clickref', clickRef);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/**
 * Directorio centralizado de merchants de Awin que usamos.
 * Se actualiza conforme Awin apruebe cada programa.
 *
 * El `merchantId` lo obtienes en Awin → Programmes → tu programa aprobado
 * (panel superior, junto al nombre del anunciante).
 */
export const AWIN_MERCHANTS: Record<string, { name: string; merchantId: string; logo?: string }> = {
  // Descomenta/añade conforme Awin apruebe cada programa:
  // pccomponentes: { name: 'PcComponentes', merchantId: 'XXXXX', logo: '/logos/pccomponentes.svg' },
  // mediamarkt:    { name: 'MediaMarkt',    merchantId: 'XXXXX', logo: '/logos/mediamarkt.svg' },
  // elcorteingles: { name: 'El Corte Inglés', merchantId: 'XXXXX', logo: '/logos/eci.svg' },
  // worten:        { name: 'Worten',        merchantId: 'XXXXX', logo: '/logos/worten.svg' },
  // aliexpress:    { name: 'AliExpress',    merchantId: 'XXXXX', logo: '/logos/aliexpress.svg' },
};
