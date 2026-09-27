import { execFileSync } from 'node:child_process';
// The frozen-snapshot validator supports both full Git checkouts and Render source archives.
// It checks the historical package when Git is present, or the existing pinned portable proof.
execFileSync(process.execPath,['scripts/validate-frozen-museum-snapshot.mjs'],{stdio:'inherit'});
console.log('BUILD_HISTORY_OR_PORTABLE_PROOF_READY f8d046bdfea2c0854364579cca59cbd2fd85a8b9');
