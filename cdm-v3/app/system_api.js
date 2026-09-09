const API = "/api/system";
const byId = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Erreur HTTP ${response.status}`);
  return payload;
}

function renderModules(state) {
  byId("modules").innerHTML = state.modules.map((item) => `
    <article class="module">
      <span class="letter">${esc(item.id)}</span>
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.purpose)}</p>
      <p class="fallback"><b>${item.autonomous ? "Autonomie de base" : "Résilience"}</b><br>${esc(item.fallback)}</p>
    </article>`).join("");
}

function renderModes(state) {
  byId("modes").innerHTML = state.modes.map((item) => `
    <div class="mode"><b>${esc(item.name)}</b><span>${esc(item.function)}</span></div>`).join("");
}

function renderMachines(state) {
  byId("machines").innerHTML = state.machines.map((item) => `
    <div class="asset">
      <div><strong>${esc(item.label)}</strong><small>${esc(item.collector_mode)} · ${esc(item.status)}</small></div>
      <div class="meter"><span style="width:${Math.max(0, Math.min(100, Number(item.remaining_percent)))}%"></span></div>
      <span class="pct">${esc(item.remaining_percent)} % libre</span>
    </div>`).join("");
}

function renderBins(state) {
  byId("bins").innerHTML = state.bins.map((item) => `
    <div class="asset">
      <div><strong>${esc(item.label)}</strong><small>${item.compatible_lmi ? "Interface LMI compatible" : "Vidage conventionnel"} · ${esc(item.capacity_l)} L</small></div>
      <div class="meter"><span style="width:${Math.max(0, Math.min(100, Number(item.fill_percent)))}%"></span></div>
      <span class="pct ${Number(item.fill_percent) >= 70 ? "high" : ""}">${esc(item.fill_percent)} %</span>
    </div>`).join("");
}

function renderInterface(state) {
  byId("interface-standard").textContent = state.interface_standard;
  byId("interface-flow").innerHTML = state.interface_phases.map((phase) => `<div class="phase">${esc(phase)}</div>`).join("");
}

function renderOptimization(assignments) {
  const target = byId("optimization");
  if (!assignments.length) {
    target.innerHTML = '<div class="assignment"><b>Aucune collecte prioritaire</b><br>Le réseau peut rester en fonctionnement local.</div>';
    return;
  }
  target.innerHTML = assignments.map((item) => `
    <div class="assignment">
      <b>${esc(item.bin_id)}</b> → ${item.machine_id ? `<b>${esc(item.machine_id)}</b>` : "aucune machine assignée"}<br>
      Priorité ${esc(item.priority)}${item.estimated_transfer_l !== undefined ? ` · transfert estimé ${esc(item.estimated_transfer_l)} L` : ""}<br>
      <small>${esc(item.reason)}</small>
    </div>`).join("");
}

function syncSelectors(state) {
  const machine = byId("machine-select");
  const bin = byId("bin-select");
  const machineValue = machine.value;
  const binValue = bin.value;
  machine.innerHTML = state.machines.map((item) => `<option value="${esc(item.id)}">${esc(item.label)} — ${esc(item.remaining_percent)} % libre</option>`).join("");
  bin.innerHTML = state.bins.map((item) => `<option value="${esc(item.id)}">${esc(item.label)} — ${esc(item.fill_percent)} %</option>`).join("");
  if ([...machine.options].some((option) => option.value === machineValue)) machine.value = machineValue;
  if ([...bin.options].some((option) => option.value === binValue)) bin.value = binValue;
}

function renderMetrics(state) {
  byId("metric-machines").textContent = state.metrics.machines;
  byId("metric-bins").textContent = state.metrics.bins;
  byId("metric-alerts").textContent = state.metrics.bins_over_70_percent;
  byId("metric-events").textContent = state.metrics.transfer_events;
  byId("principle").textContent = state.principle;
  byId("system-version").textContent = `Prototype numérique ${state.version}`;
}

function renderState(state) {
  renderMetrics(state);
  renderModules(state);
  renderModes(state);
  renderMachines(state);
  renderBins(state);
  renderInterface(state);
  renderOptimization(state.optimization);
  syncSelectors(state);
}

function renderTransfer(event) {
  byId("result").innerHTML = `
    <strong>${esc(event.result)}</strong>
    <p>${esc(event.machine_id)} → ${esc(event.bin_id)} · ${esc(event.transferred_l)} L transférés · ${event.rinse ? "rinçage effectué" : "sans rinçage"}</p>
    <ol>${event.phases.map((phase) => `<li>${esc(phase)}</li>`).join("")}</ol>`;
}

async function loadState() {
  const state = await request("/state");
  renderState(state);
  byId("service-status").innerHTML = '<span class="dot"></span>Système numérique opérationnel';
}

async function dock() {
  const button = byId("dock-button");
  button.disabled = true;
  byId("result").innerHTML = '<span class="muted">Simulation du cycle fermé…</span>';
  try {
    const payload = await request("/dock", {
      method: "POST",
      body: JSON.stringify({
        machine_id: byId("machine-select").value,
        bin_id: byId("bin-select").value,
        rinse: byId("rinse").checked,
        manual_fallback: false,
      }),
    });
    renderTransfer(payload.event);
    renderState(payload.state);
  } catch (error) {
    byId("result").innerHTML = `<span class="error">${esc(error.message)}</span>`;
  } finally {
    button.disabled = false;
  }
}

async function optimize() {
  const button = byId("optimize-button");
  button.disabled = true;
  try {
    const payload = await request("/optimize", {method: "POST", body: "{}"});
    renderOptimization(payload.assignments);
  } catch (error) {
    byId("optimization").innerHTML = `<div class="assignment error">${esc(error.message)}</div>`;
  } finally {
    button.disabled = false;
  }
}

async function resetDemo() {
  const button = byId("reset-button");
  button.disabled = true;
  try {
    const state = await request("/demo/reset", {method: "POST", body: "{}"});
    renderState(state);
    byId("result").innerHTML = '<span class="muted">Démonstrateur réinitialisé : Corbeille 127 à 82 %, Corbeille 214 à 41 %, Machine 03 à 34 % de capacité restante.</span>';
  } catch (error) {
    byId("result").innerHTML = `<span class="error">${esc(error.message)}</span>`;
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  byId("dock-button").addEventListener("click", dock);
  byId("optimize-button").addEventListener("click", optimize);
  byId("reset-button").addEventListener("click", resetDemo);
  loadState().catch((error) => {
    byId("service-status").innerHTML = `<span class="error">${esc(error.message)}</span>`;
  });
});
