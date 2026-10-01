/**
 * With build.format "file", Astro.url.pathname is /blog/foo.html at build time
 * (but /blog/foo in dev). Strip it so canonical URLs and breadcrumbs match the
 * slashless URLs the site actually serves.
 */
export function cleanPath(pathname: string): string {
  return pathname.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";
}
