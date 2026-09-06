/**
 * Creates any built-in email template that is missing from the database.
 *
 * seedDefaults() only runs when the table is completely empty, so a template
 * added in code after the first boot never appears on an existing install.
 *
 * Existing templates are left alone — their subject and body are editable in
 * Settings, and overwriting them would throw away that work. Pass --overwrite
 * to force a specific slug back to the built-in version.
 *
 * Run: bun scripts/sync-email-templates.js
 *      bun scripts/sync-email-templates.js --overwrite --slug=invoice-sent
 */
import prisma from "../src/utils/prisma.js";
import { DEFAULT_TEMPLATES } from "../src/modules/email-template/email-template.service.js";

const args = process.argv.slice(2);
const overwrite = args.includes("--overwrite");
const only = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

const targets = only ? DEFAULT_TEMPLATES.filter((t) => t.slug === only) : DEFAULT_TEMPLATES;

if (targets.length === 0) {
  console.error(only ? `No built-in template with slug "${only}".` : "No built-in templates found.");
  process.exit(1);
}

let created = 0;
let updated = 0;

for (const tpl of targets) {
  const existing = await prisma.emailTemplate.findUnique({ where: { slug: tpl.slug } });

  if (!existing) {
    await prisma.emailTemplate.create({ data: tpl });
    console.log(`+ ${tpl.slug} — created`);
    created += 1;
  } else if (overwrite) {
    await prisma.emailTemplate.update({
      where: { slug: tpl.slug },
      data: { name: tpl.name, subject: tpl.subject, description: tpl.description, variables: tpl.variables, body: tpl.body },
    });
    console.log(`~ ${tpl.slug} — overwritten`);
    updated += 1;
  } else {
    console.log(`= ${tpl.slug} — already present, left as is`);
  }
}

console.log(`\nDone. ${created} created, ${updated} overwritten. Restart the server to clear the template cache.`);
await prisma.$disconnect();
