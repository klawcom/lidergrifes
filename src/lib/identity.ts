import logo from '@/assets/brand-final.png.asset.json';
import share from '@/assets/share-final.jpg.asset.json';
export const brandLogo = logo.url;
export const shareImage = `https://lidergrifes.lovable.app${share.url}`;
export const privateHead = (title: string, description: string) => ({ meta: [
 { title: `${title} — Líder Grifes Atacado` }, { name: 'description', content: description },
 { property: 'og:title', content: `${title} — Líder Grifes Atacado` }, { property: 'og:description', content: description },
 { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }, { name: 'robots', content: 'noindex' },
] });
