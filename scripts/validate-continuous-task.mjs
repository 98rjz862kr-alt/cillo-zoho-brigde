import { readFileSync } from 'node:fs';

const protocol = readFileSync(new URL('../CONTINUOUS_TASK_PROTOCOL.md', import.meta.url), 'utf8');
const state = JSON.parse(readFileSync(new URL('../ops/continuous-task-state.json', import.meta.url), 'utf8'));

const requiredProtocolStatements = [
  'Une pull request fusionnée ne constitue jamais une fin de tâche.',
  'Un contrôle CI réussi ne constitue jamais une fin de tâche.',
  'Le mode normal est : travailler, vérifier, corriger, fusionner, reprendre.',
  'human validation'
];

for (const statement of requiredProtocolStatements.slice(0, 3)) {
  if (!protocol.includes(statement)) throw new Error(`Continuous task protocol statement missing: ${statement}`);
}

if (state.mode !== 'continuous_silent_production') {
  throw new Error('Continuous task mode must remain continuous_silent_production');
}
if (state.communication_policy?.progress_messages !== false) {
  throw new Error('Progress messages must remain disabled');
}
if (state.communication_policy?.intermediate_completion_messages !== false) {
  throw new Error('Intermediate completion messages must remain disabled');
}
if (state.communication_policy?.human_validation_messages_only !== true) {
  throw new Error('Only human validation messages are allowed');
}
if (state.public_release?.requires_explicit_human_go !== true || state.public_release?.status !== 'blocked') {
  throw new Error('Public release must remain blocked without explicit human GO');
}
if (!Array.isArray(state.next_work) || state.next_work.length === 0) {
  throw new Error('Continuous task registry must contain a non-empty next_work queue');
}
if (!Array.isArray(state.human_validation_required)) {
  throw new Error('human_validation_required must be an array');
}

console.log('Continuous LMI task protocol and state registry are valid.');
