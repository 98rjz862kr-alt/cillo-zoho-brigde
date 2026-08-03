const HUB_RUNTIME_PATTERN = /^hub-lmi-editions\/(?:0[2-9]|[12][0-9]|3[0-2])-[^/]+\.html$/i;

const STABILITY_CSS = `
<style id="lmi-runtime-stability-style">
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero[data-lmi-hero-fallback="true"]{max-width:none!important;width:100%!important}
body[data-lmi-runtime="premium-v2"] main .lmi-runtime-hero[data-lmi-hero-fallback="true"]{border-radius:0!important}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime[data-lmi-card-invalid="true"]{padding:initial!important;border:initial!important;border-radius:initial!important;background:initial!important;box-shadow:initial!important;overflow:visible!important;transform:none!important}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime[data-lmi-card-invalid="true"]::after{display:none!important}
</style>`;

const STABILITY_SCRIPT = `
<script id="lmi-runtime-stability-script">
(function(){
  const body=document.body;
  if(!body||body.dataset.lmiRuntime!=='premium-v2')return;

  const h1=body.querySelector('h1');
  const currentHero=body.querySelector('.lmi-runtime-hero');
  const semanticHero=h1?.closest('header,section');
  if(semanticHero&&currentHero&&semanticHero!==currentHero){
    currentHero.classList.remove('lmi-runtime-hero');
    semanticHero.classList.add('lmi-runtime-hero');
  }else if(currentHero&&!['HEADER','SECTION'].includes(currentHero.tagName)){
    currentHero.dataset.lmiHeroFallback='true';
  }

  const reliable='.card,.panel,.pole,.axis,.offer,.feature,.bloc,.notice,.scope,.box,.tile,article';
  body.querySelectorAll('.lmi-card-runtime').forEach((element)=>{
    if(element.matches(reliable))return;
    const hasHeading=Boolean(element.querySelector(':scope > h2,:scope > h3,:scope > h4'));
    const parentIsGrid=Boolean(element.parentElement?.matches('.grid,.cards,.poles,.axes,.features,.tiles,.items,.catalogue-grid,.section-grid,.work-grid,.resource-grid,.offer-grid,.lmi-runtime-grid'));
    if(!hasHeading&&!parentIsGrid){
      element.classList.remove('lmi-card-runtime');
      element.dataset.lmiCardInvalid='true';
    }
  });
})();
</script>`;

function decodeAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(String(source || '')))) {
    attributes.set(match[1].toLowerCase(), {
      name: match[1],
      value: match[2] ?? match[3] ?? match[4] ?? null
    });
  }
  return attributes;
}

function encodeAttribute(attribute) {
  if (attribute.value === null) return attribute.name;
  return `${attribute.name}="${String(attribute.value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
}

function mergeBodyTag(originalHtml, renderedHtml) {
  const originalMatch = String(originalHtml || '').match(/<body([^>]*)>/i);
  const renderedMatch = String(renderedHtml || '').match(/<body([^>]*)>/i);
  if (!originalMatch || !renderedMatch) return renderedHtml;

  const original = decodeAttributes(originalMatch[1]);
  const rendered = decodeAttributes(renderedMatch[1]);

  const originalClass = original.get('class')?.value || '';
  const renderedClass = rendered.get('class')?.value || '';
  const classes = [...new Set(`${originalClass} ${renderedClass}`.split(/\s+/).filter(Boolean))];
  if (classes.length) rendered.set('class', { name: 'class', value: classes.join(' ') });

  for (const [key, attribute] of original) {
    if (key === 'class') continue;
    if (key === 'data-lmi-runtime' || key === 'data-lmi-group' || key === 'data-lmi-page') continue;
    if (!rendered.has(key)) rendered.set(key, attribute);
  }

  const bodyTag = `<body ${[...rendered.values()].map(encodeAttribute).join(' ')}>`;
  return String(renderedHtml || '').replace(/<body(?:\s[^>]*)?>/i, bodyTag);
}

export function stabilizeHubRuntime(relativePath, originalHtml, renderedHtml) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  if (!HUB_RUNTIME_PATTERN.test(normalized)) return renderedHtml;

  let output = mergeBodyTag(originalHtml, renderedHtml);
  if (!output.includes('id="lmi-runtime-stability-style"')) {
    output = output.replace(/<\/head>/i, `${STABILITY_CSS}</head>`);
  }
  if (!output.includes('id="lmi-runtime-stability-script"')) {
    output = output.replace(/<\/body>/i, `${STABILITY_SCRIPT}</body>`);
  }
  return output;
}
