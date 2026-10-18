// Progressive enhancement: every navigation link remains visible without JS.
// The same header is used by editorial pages and the commercial catalogue.
function enhanceMobileNavigation() {
  const header = document.querySelector('[data-lmi-shared-header]');
  const button = header?.querySelector('[data-lmi-menu-toggle]');
  const navigation = button && document.getElementById(button.getAttribute('aria-controls'));
  if (!header || !button || !navigation || typeof window.matchMedia !== 'function') return;

  const mobile = window.matchMedia('(max-width: 760px)');
  let expanded = false;
  function render() {
    button.hidden = !mobile.matches;
    navigation.hidden = mobile.matches && !expanded;
    button.setAttribute('aria-expanded', String(!navigation.hidden));
  }
  button.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobile.matches || !expanded) return;
    expanded = false;
    render();
    button.focus();
  });
  navigation.addEventListener('click', event => {
    const href = event.target.closest('a')?.getAttribute('href');
    if (!mobile.matches || !expanded || !href?.startsWith('#')) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(href.slice(1))); }
    catch { return; }
    if (!target) return;
    expanded = false;
    render();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  function resize() {
    const focusWasInside = navigation.contains(document.activeElement);
    const focusWasToggle = document.activeElement === button;
    expanded = false;
    render();
    if (mobile.matches && focusWasInside) button.focus();
    else if (!mobile.matches && focusWasToggle) navigation.querySelector('a[href]')?.focus();
  }
  if (mobile.addEventListener) mobile.addEventListener('change', resize);
  else if (mobile.addListener) mobile.addListener(resize);
  render();
}

export const mobileNavigationScript = `(${enhanceMobileNavigation.toString()})();`;
