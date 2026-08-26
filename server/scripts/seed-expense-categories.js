/**
 * Seeds the default expense categories and their claim-form templates.
 * Idempotent — upserts by name, so re-running never duplicates or clobbers
 * a category an admin has since customised beyond its schema.
 *
 * Run: bun scripts/seed-expense-categories.js
 */
import prisma from "../src/utils/prisma.js";

const CATEGORIES = [
  {
    name: "Travel / Tour",
    icon: "Plane",
    description: "Client visits, shoots, offsites — travel, stay and per-diem.",
    requiresReceipt: true,
    sortOrder: 1,
    fieldSchema: [
      { id: "from", label: "From", type: "text", required: true, placeholder: "Delhi" },
      { id: "to", label: "To", type: "text", required: true, placeholder: "Mumbai" },
      { id: "departDate", label: "Departure date", type: "date", required: true },
      { id: "returnDate", label: "Return date", type: "date" },
      { id: "days", label: "Number of days", type: "number", required: true },
      {
        id: "mode", label: "Travel mode", type: "select", required: true,
        options: ["Car", "Train", "Flight", "Bus", "Cab"],
      },
      { id: "purpose", label: "Purpose of travel", type: "textarea", required: true },
      { id: "notes", label: "Additional notes", type: "textarea" },
    ],
  },
  {
    name: "Fuel / Mileage",
    icon: "Fuel",
    description: "Own vehicle used for work. Claimed per kilometre.",
    requiresReceipt: false,
    sortOrder: 2,
    fieldSchema: [
      { id: "from", label: "From", type: "text", required: true },
      { id: "to", label: "To", type: "text", required: true },
      {
        id: "mileage", label: "Distance (km)", type: "number", required: true,
        // Auto-fills the amount at the agency rate; the claimant can override.
        computed: { rate: 12, into: "amount" },
      },
      { id: "vehicle", label: "Vehicle", type: "text", placeholder: "Own car / bike" },
      { id: "purpose", label: "Purpose", type: "textarea", required: true },
    ],
  },
  {
    name: "Food & Meals",
    icon: "UtensilsCrossed",
    description: "Working meals, team lunches, meals while travelling.",
    requiresReceipt: true,
    sortOrder: 3,
    fieldSchema: [
      {
        id: "mealType", label: "Meal", type: "select", required: true,
        options: ["Breakfast", "Lunch", "Dinner", "Snacks"],
      },
      { id: "people", label: "Number of people", type: "number", required: true },
      { id: "venue", label: "Restaurant / venue", type: "text" },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Accommodation",
    icon: "BedDouble",
    description: "Hotels and stays while on work travel.",
    requiresReceipt: true,
    sortOrder: 4,
    fieldSchema: [
      { id: "hotel", label: "Hotel / property", type: "text", required: true },
      { id: "city", label: "City", type: "text", required: true },
      { id: "checkIn", label: "Check-in", type: "date", required: true },
      { id: "checkOut", label: "Check-out", type: "date", required: true },
      { id: "nights", label: "Nights", type: "number", required: true },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Software & Subscriptions",
    icon: "AppWindow",
    description: "Tools, licences and recurring SaaS.",
    requiresReceipt: true,
    isReimbursable: false,
    sortOrder: 5,
    fieldSchema: [
      { id: "tool", label: "Tool / service", type: "text", required: true },
      {
        id: "billing", label: "Billing cycle", type: "select", required: true,
        options: ["One-time", "Monthly", "Quarterly", "Yearly"],
      },
      { id: "seats", label: "Seats / licences", type: "number" },
      { id: "renewsOn", label: "Renews on", type: "date" },
      { id: "notes", label: "What it is used for", type: "textarea", required: true },
    ],
  },
  {
    name: "Equipment / Hardware",
    icon: "HardDrive",
    description: "Cameras, drives, peripherals and other kit.",
    requiresReceipt: true,
    isReimbursable: false,
    sortOrder: 6,
    fieldSchema: [
      { id: "item", label: "Item", type: "text", required: true },
      { id: "quantity", label: "Quantity", type: "number", required: true },
      { id: "vendor", label: "Vendor", type: "text" },
      { id: "warranty", label: "Warranty until", type: "date" },
      { id: "assignedTo", label: "Assigned to", type: "text" },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Client Entertainment",
    icon: "Users",
    description: "Hosting clients — meals, events, gifts.",
    requiresReceipt: true,
    sortOrder: 7,
    fieldSchema: [
      { id: "clientName", label: "Client / company", type: "text", required: true },
      { id: "attendees", label: "Attendees", type: "text", required: true },
      { id: "occasion", label: "Occasion", type: "text" },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Other",
    icon: "Receipt",
    description: "Anything that does not fit the categories above.",
    requiresReceipt: false,
    sortOrder: 99,
    fieldSchema: [
      { id: "notes", label: "What was this for?", type: "textarea", required: true },
    ],
  },
];

async function main() {
  for (const c of CATEGORIES) {
    const existing = await prisma.expenseCategory.findUnique({ where: { name: c.name } });
    if (existing) {
      console.log(`= ${c.name} (already exists, left untouched)`);
      continue;
    }
    await prisma.expenseCategory.create({ data: c });
    console.log(`+ ${c.name}`);
  }
  console.log(`\nDone — ${CATEGORIES.length} categories checked.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
