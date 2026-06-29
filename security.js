const DANGEROUS_TAGS = [
  'base',
  'embed',
  'link',
  'meta',
  'object',
  'script',
  'style'
];

const dangerousTagPattern = new RegExp(
  `<\\s*(${DANGEROUS_TAGS.join('|')})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`,
  'gi'
);
const dangerousSingleTagPattern = new RegExp(
  `<\\s*\\/?\\s*(${DANGEROUS_TAGS.join('|')})\\b[^>]*\\/?>`,
  'gi'
);

export function sanitizePageHtml(html) {
  return String(html || '')
    .replaceAll('\0', '')
    .replace(dangerousTagPattern, '')
    .replace(dangerousSingleTagPattern, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*"\s*(javascript:|vbscript:|data:text\/html)[^"]*"/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*'\s*(javascript:|vbscript:|data:text\/html)[^']*'/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*(javascript:|vbscript:|data:text\/html)[^\s>]*/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*("|')?\s*javascript:/gi, 'url(');
}

export function getAdminPassword() {
  const value = process.env.ADMIN_PASSWORD || '';
  if (!value || value === 'change-me') return '';
  return value;
}

export function isAuthorized({ headers = {}, query = {}, body = {} }) {
  const provided = headers['x-admin-password'] || query.password || body.password;
  const expected = getAdminPassword();
  return Boolean(expected) && provided === expected;
}
