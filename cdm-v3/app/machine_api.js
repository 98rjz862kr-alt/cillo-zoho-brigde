(() => {
  const api = async (path, options = {}) => {
    const response = await fetch(`/api/machine${path}`, {
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  const formatTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const hydrate = (payload) => {
    if (!payload) return;
    state.repos = payload.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      domain: repo.domain,
      status: repo.status === 'warning' ? 'warn' : repo.status === 'error' ? 'error' : 'ok',
      control: formatTime(repo.last_control),
      render: repo.render_status,
      drive: repo.drive_connected,
      github: repo.github_connected,
      version: repo.version,
    }));
    state.logs = payload.events.map((event) => [
      formatTime(event.created_at),
      `${event.action} — ${event.target}`,
      event.result,
    ]);
    state.controls = payload.controls.map((control) => [control.name, control.count]);
    state.reports = payload.reports.map((report) => [
      report.title,
      new Date(report.created_at).toLocaleString('fr-FR'),
      report.scope,
      report.result,
    ]);
    state.rules = {
      autoControl: Boolean(payload.settings.autoControl),
      autoBackup: Boolean(payload.settings.autoBackup),
      autoRestart: Boolean(payload.settings.autoRestart),
      quietMode: Boolean(payload.settings.quietMode),
      humanValidation: Boolean(payload.settings.humanValidation),
    };
    renderAll();
    const score = document.querySelector('#qualityScore');
    if (score) score.textContent = `${payload.metrics.quality}%`;
    const alerts = payload.metrics.critical_alerts || 0;
    const qualityText = document.querySelector('#qualityText');
    if (qualityText) qualityText.textContent = alerts ? `${alerts} anomalie(s) critique(s)` : 'Aucune anomalie critique';
  };

  const refresh = async () => hydrate(await api('/state'));

  const actionMap = {
    'global-control': '/actions/control-global',
    'deploy-all': '/actions/deploy-all',
    backup: '/actions/backup',
    report: '/actions/report',
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('button,[data-rule]');
    if (!button) return;
    try {
      if (button.dataset.repoControl) {
        event.stopImmediatePropagation();
        toast('Contrôle en cours…');
        hydrate(await api(`/repositories/${button.dataset.repoControl}/control`, { method: 'POST' }));
        toast('Contrôle terminé');
      } else if (button.dataset.repoDeploy) {
        event.stopImmediatePropagation();
        toast('Déploiement en cours…');
        hydrate(await api(`/repositories/${button.dataset.repoDeploy}/deploy`, { method: 'POST' }));
        toast('Déploiement terminé');
      } else if (button.dataset.action && actionMap[button.dataset.action]) {
        event.stopImmediatePropagation();
        toast('Exécution en cours…');
        hydrate(await api(actionMap[button.dataset.action], { method: 'POST' }));
        toast('Action terminée');
      } else if (button.dataset.action === 'save-rules') {
        event.stopImmediatePropagation();
        const form = document.querySelector('#settingsForm');
        const values = form ? Object.fromEntries(new FormData(form).entries()) : {};
        const body = { ...state.rules, ...values };
        hydrate(await api('/settings', { method: 'PATCH', body: JSON.stringify(body) }));
        toast('Règles enregistrées');
      }
    } catch (error) {
      console.error(error);
      toast('Action impossible');
    }
  }, true);

  window.addEventListener('load', () => {
    refresh().catch((error) => console.error('Machine API unavailable', error));
    setInterval(() => refresh().catch(() => {}), 30000);
  });
})();
