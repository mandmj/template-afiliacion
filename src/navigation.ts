import { getPermalink, getAsset } from './utils/permalinks';

// {{CATEGORY_SLUGS}} — ajusta según tu nicho antes del primer deploy
// Ejemplos por nicho:
//   Patinetes: urbano, off-road, larga-autonomia, ultraligero, marca-espanola, barato
//   Proyectores: 4k, portatil, led, laser, con-tv, barato
//   Robots cocina: multifuncion, con-vaso, barato, premium, panificadora
export const headerData = {
  links: [
    { text: 'Reviews', href: getPermalink('/reviews') },
    { text: 'Comparativas', href: getPermalink('/comparativas') },
    {
      text: 'Categorías',
      links: [
        // { text: 'Categoría 1', href: getPermalink('/categoria/slug-1') },
        // { text: 'Categoría 2', href: getPermalink('/categoria/slug-2') },
        // { text: 'Categoría 3', href: getPermalink('/categoria/slug-3') },
      ],
    },
    {
      text: 'Guías',
      links: [
        { text: 'Guía de compra', href: getPermalink('/guia-de-compra') },
        { text: 'Todas las guías', href: getPermalink('/guias') },
      ],
    },
    { text: 'Contacto', href: getPermalink('/contact') },
  ],
  actions: [
    {
      text: 'Ver recomendaciones',
      href: getPermalink('/reviews'),
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Contenido',
      links: [
        { text: 'Todas las reviews', href: getPermalink('/reviews') },
        { text: 'Comparativas', href: getPermalink('/comparativas') },
        { text: 'Guías', href: getPermalink('/guias') },
        { text: 'Guía de compra', href: getPermalink('/guia-de-compra') },
      ],
    },
    {
      title: 'Categorías',
      links: [
        // Añade aquí las mismas categorías que tengas en el header
      ],
    },
    {
      title: 'Información',
      links: [
        { text: 'Sobre nosotros', href: getPermalink('/about') },
        { text: 'Contacto', href: getPermalink('/contact') },
        { text: 'Aviso legal', href: getPermalink('/aviso-legal') },
        { text: 'Política de privacidad', href: getPermalink('/politica-privacidad') },
        { text: 'Política de cookies', href: getPermalink('/politica-cookies') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Aviso legal', href: getPermalink('/aviso-legal') },
    { text: 'Privacidad', href: getPermalink('/politica-privacidad') },
    { text: 'Cookies', href: getPermalink('/politica-cookies') },
  ],
  socialLinks: [{ ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') }],
  footNote: `
    © {{SITE_NAME}} · {{AUTOR}} · NIF {{NIF}} · Participante en el Programa de Afiliados de Amazon Europe S.à.r.l.
  `,
};
