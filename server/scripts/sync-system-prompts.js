/**
 * Pushes the built-in system prompts from code into the database.
 *
 * seedDefaults() only ever CREATES a prompt that is missing, so editing a
 * default in code never reaches an existing install. This script updates the
 * stored copy, which is what you want after improving a prompt.
 *
 * By default it only reports what differs. Pass --write to apply, and
 * --slug=<slug> to limit it to one prompt.
 *
 * Run: bun scripts/sync-system-prompts.js --write
 *      bun scripts/sync-system-prompts.js --write --slug=crm-copilot-assistant
 */
import prisma from "../src/utils/prisma.js";
import { DEFAULT_PROMPTS } from "../src/modules/system-prompt/system-prompt.service.js";

const args = process.argv.slice(2);
const write = args.includes("--write");
const only = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

const targets = only ? DEFAULT_PROMPTS.filter((p) => p.slug === only) : DEFAULT_PROMPTS;

if (targets.length === 0) {
  console.error(only ? `No built-in prompt with slug "${only}".` : "No built-in prompts found.");
  process.exit(1);
}

let changed = 0;

for (const def of targets) {
  const existing = await prisma.systemPrompt.findUnique({ where: { slug: def.slug } });

  if (!existing) {
    console.log(`+ ${def.slug} — missing, will be created`);
    if (write) await prisma.systemPrompt.create({ data: def });
    changed += 1;
    continue;
  }

  const differs =
    existing.prompt !== def.prompt ||
    existing.responseSchema !== (def.responseSchema ?? null) ||
    existing.description !== (def.description ?? null);

  if (!differs) {
    console.log(`= ${def.slug} — already up to date`);
    continue;
  }

  console.log(
    `~ ${def.slug} — stored ${existing.prompt.length} chars, built-in ${def.prompt.length} chars`
  );
  changed += 1;

  if (write) {
    await prisma.systemPrompt.update({
      where: { slug: def.slug },
      data: {
        prompt: def.prompt,
        description: def.description,
        responseSchema: def.responseSchema,
        // An out-of-date prompt that someone had disabled stays disabled.
        ...(existing.isActive ? {} : {}),
      },
    });
  }
}

console.log(
  write
    ? `\nDone. ${changed} prompt(s) written. Restart the server so the prompt cache clears.`
    : `\n${changed} prompt(s) differ. Re-run with --write to apply.`
);

await prisma.$disconnect();
