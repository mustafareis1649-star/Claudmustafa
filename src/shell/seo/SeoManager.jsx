import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_META, DEFAULT_SEO } from './seoMeta';

// Sets a unique <title> and meta description for whichever route is
// currently showing. This is a single-page app (no server-side rendering),
// so the initial HTML always ships with the homepage's title — this
// component swaps it in on the client as soon as the route is known. Search
// engines that execute JavaScript (Google does) still pick this up fine.
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = SEO_META[pathname] || DEFAULT_SEO;
    document.title = meta.title;

    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', meta.description);
  }, [pathname]);

  return null;
}
