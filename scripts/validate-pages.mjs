import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/pages.json', import.meta.url), 'utf8'));
if (!Array.isArray(data.pages) || data.pages.length === 0) {
  throw new Error('data/pages.json must contain at least one page');
}

const machine = data.pages.find((page) => page.id === 'cdm-validation-v040');
if (!machine) throw new Error('CDM validation page is missing');
if (machine.title !== 'CDM — Machine de contrôle v1.4') {
  throw new Error(`Unexpected CDM machine title: ${machine.title}`);
}
if (!machine.html.includes("id='dash'")) throw new Error('Dashboard panel is missing');
if (!machine.html.includes("data-p='repos'")) throw new Error('Repository navigation is missing');
if (!machine.html.includes("data-a='control'")) throw new Error('Global control action is missing');
if (!machine.html.includes("data-a='deploy'")) throw new Error('Global deployment action is missing');
if (!machine.html.includes("data-a='backup'")) throw new Error('Drive backup action is missing');
if (!machine.html.includes("data-a='report'")) throw new Error('Report action is missing');

const scripts = [...machine.html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
if (scripts.length !== 1) throw new Error(`Expected one inline script, found ${scripts.length}`);
new Function(scripts[0]);

console.log(`Validated ${data.pages.length} page(s); CDM machine preview v${machine.version} is structurally complete.`);
