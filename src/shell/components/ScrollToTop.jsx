import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation by itself — so
// if a visitor was scrolled down on one page (e.g. reading the pricing
// section) and clicks a link to another page (e.g. "Sign in" -> /account),
// the browser keeps the same scroll offset. On a shorter page that lands
// them near the bottom / on blank space, looking like the page "jumped to
// the bottom" instead of opening normally. This scrolls to the top on every
// route change, before the new page is visible.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
