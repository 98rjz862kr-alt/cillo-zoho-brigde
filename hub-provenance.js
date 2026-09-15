const HUB_VISUAL_PROVENANCE = Object.freeze({
  'logo-lmi-hub.webp': Object.freeze({
    sourceDriveId: '1tRvVtzTrDsaYg59cxmtdu5ITLv02Vrgy',
    sourceName: 'NAPATA — RÉFÉRENCE LOGO LMI — MASTER FOURNI — 2026-08-23.jpeg',
    sourceMimeType: 'image/jpeg',
    sourceSha256: 'f20a38b1106c04f1265831474b60d7f607776fda3e98ad0e2db00c02622566b3',
    sourceRole: 'institutional-logo-master',
    sourceStatus: 'canonical-drive-source'
  }),
  'boa-totem-soya.webp': Object.freeze({
    sourceDriveId: '1qKmgxf40Dl4rS16ZA1PRodF29NmUowDA',
    sourceName: 'COUVERTURE_BOA_TOTEM_SOYA_PREPUB_V2.jpg',
    sourceMimeType: 'image/jpeg',
    sourceSha256: '13ac00be26e61f6537cbeb1fb32977689a558437e94ceb0aed86c8d7495f6f5e',
    sourceRole: 'editorial-cover-master',
    sourceStatus: 'canonical-drive-source'
  }),
  'le-fleuve-sans-nom.webp': Object.freeze({
    sourceDriveId: '105ruK0gmwVqt9tcNL6vSf5w8P1BMgYij',
    sourceName: 'COUVERTURE_FLEUVE_SANS_NOM_PREPUB_V2.jpg',
    sourceMimeType: 'image/jpeg',
    sourceSha256: '3803846c2c5651c5d7f6c1fd775806d0ac3eac57367ab0f58911c381dc4e88aa',
    sourceRole: 'editorial-cover-master',
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
