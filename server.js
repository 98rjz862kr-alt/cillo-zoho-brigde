CILLO BRIDGE v2.1 - PATCH SERVER.JS

Objectif:
Permettre a list_site_pages d'envoyer le mot de passe dans le body JSON.

Dans server.js, chercher le bloc qui gere:
url.pathname === '/api/pages'

Remplacer ou ajouter ce bloc apres:
const body = await parseBody(req);

CODE A UTILISER:

if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/api/pages') {
  if (!requireAdmin(req, res, query, body)) return;
  return sendJson(res, await listPages(body.siteSlug || query.siteSlug));
}

Important:
- Ne supprime pas security.js.
- Ne modifie pas ADMIN_PASSWORD.
- Ne touche pas aux routes de creation, update, review, approve, publish.
