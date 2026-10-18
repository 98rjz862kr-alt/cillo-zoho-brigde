import path from 'node:path';

// Resolve URLs against the original draft, never the encoded atelier URL.
export function previewUrl(relativePath, value) {
  const raw = String(value || '').trim();
  if (!raw || /^(?:#|\/|[a-z][a-z0-9+.-]*:)/i.test(raw)) return value;
  try {
    const url = new URL(raw.replaceAll('&amp;', '&'), 'https://draft.invalid/' + relativePath);
    const target = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (url.origin !== 'https://draft.invalid' || !target || target.startsWith('../')) return value;
    return '/atelier/file/' + encodeURIComponent(target) + url.search.replaceAll('&', '&amp;') + url.hash;
  } catch { return value; }
}

export function rewritePreviewHtml(relativePath, html) {
  return html.replace(/<(?:a|link|img|script|source|video|audio)\b[^>]*>/gi, tag =>
    tag.replace(/(\s(?:href|src|poster)\s*=\s*)(["'])([^"']*)\2/gi,
      (_, prefix, quote, value) => prefix + quote + previewUrl(relativePath, value) + quote));
}

export function rewritePreviewCss(relativePath, css) {
  return css.replace(/url\(\s*(["']?)([^)'"]+)\1\s*\)/gi,
    (_, quote, value) => 'url(' + quote + previewUrl(relativePath, value) + quote + ')');
}
