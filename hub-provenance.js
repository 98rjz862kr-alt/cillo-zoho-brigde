const HUB_VISUAL_PROVENANCE = Object.freeze({
  'logo-lmi-hub.webp': Object.freeze({
    sourceDriveId: '1tRvVtzTrDsaYg59cxmtdu5ITLv02Vrgy',
    sourceName: 'NAPATA — RÉFÉRENCE LOGO LMI — MASTER FOURNI — 2026-08-23.jpeg',
    sourceMimeType: 'image/jpeg',
    sourceSha256: 'f20a38b1106c04f1265831474b60d7f607776fda3e98ad0e2db00c02622566b3',
    sourceRole: 'institutional-logo-master',
    sourceStatus: 'canonical-drive-source'
  })
});

export function getHubVisualProvenance(assetName) {
  const provenance = HUB_VISUAL_PROVENANCE[String(assetName || '')];
  if (!provenance) throw new Error(`No canonical Drive provenance registered for Hub asset: ${assetName}`);
  return provenance;
}

export function listHubVisualProvenance() {
  return Object.entries(HUB_VISUAL_PROVENANCE).map(([assetName, provenance]) => ({ assetName, ...provenance }));
}
