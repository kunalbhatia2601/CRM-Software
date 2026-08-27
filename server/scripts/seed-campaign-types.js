/**
 * Seeds campaign types and the daily metrics each one captures.
 * Idempotent — upserts by name, never clobbers a customised template.
 *
 * Run: bun scripts/seed-campaign-types.js
 */
import prisma from "../src/utils/prisma.js";

// `formula` is evaluated against the day's metrics plus `spend`.
// Guarded division everywhere — a zero-impression day must not blow up.
const TYPES = [
  {
    name: "Meta Ads",
    platform: "META",
    icon: "Facebook",
    sortOrder: 1,
    metricSchema: [
      { id: "reach", label: "Reach", type: "count" },
      { id: "impressions", label: "Impressions", type: "count", required: true },
      { id: "clicks", label: "Clicks", type: "count", required: true },
      { id: "leads", label: "Leads", type: "count" },
      { id: "conversions", label: "Conversions", type: "count" },
    ],
    derivedMetrics: [
      { id: "ctr", label: "CTR", formula: "clicks / impressions * 100", format: "percent" },
      { id: "cpc", label: "CPC", formula: "spend / clicks", format: "currency" },
      { id: "cpm", label: "CPM", formula: "spend / impressions * 1000", format: "currency" },
      { id: "cpl", label: "Cost per lead", formula: "spend / leads", format: "currency" },
      { id: "cvr", label: "Conversion rate", formula: "conversions / clicks * 100", format: "percent" },
    ],
  },
  {
    name: "Google Ads",
    platform: "GOOGLE_ADS",
    icon: "Search",
    sortOrder: 2,
    metricSchema: [
      { id: "impressions", label: "Impressions", type: "count", required: true },
      { id: "clicks", label: "Clicks", type: "count", required: true },
      { id: "leads", label: "Leads", type: "count" },
      { id: "conversions", label: "Conversions", type: "count" },
      { id: "searchImprShare", label: "Search impression share", type: "percent" },
    ],
    derivedMetrics: [
      { id: "ctr", label: "CTR", formula: "clicks / impressions * 100", format: "percent" },
      { id: "cpc", label: "CPC", formula: "spend / clicks", format: "currency" },
      { id: "cpl", label: "Cost per lead", formula: "spend / leads", format: "currency" },
      { id: "cpa", label: "Cost per conversion", formula: "spend / conversions", format: "currency" },
    ],
  },
  {
    name: "Organic Post",
    platform: "INSTAGRAM",
    icon: "Instagram",
    sortOrder: 3,
    metricSchema: [
      { id: "reach", label: "Reach", type: "count", required: true },
      { id: "impressions", label: "Impressions", type: "count" },
      { id: "likes", label: "Likes", type: "count" },
      { id: "comments", label: "Comments", type: "count" },
      { id: "shares", label: "Shares", type: "count" },
      { id: "saves", label: "Saves", type: "count" },
      { id: "profileVisits", label: "Profile visits", type: "count" },
      { id: "followsGained", label: "Follows gained", type: "count" },
    ],
    derivedMetrics: [
      {
        id: "engagementRate", label: "Engagement rate",
        formula: "(likes + comments + shares + saves) / reach * 100", format: "percent",
      },
      { id: "saveRate", label: "Save rate", formula: "saves / reach * 100", format: "percent" },
    ],
  },
  {
    name: "Reel / Short Video",
    platform: "INSTAGRAM",
    icon: "Video",
    sortOrder: 4,
    metricSchema: [
      { id: "plays", label: "Plays", type: "count", required: true },
      { id: "reach", label: "Reach", type: "count" },
      { id: "avgWatchSeconds", label: "Avg watch time (s)", type: "duration" },
      { id: "likes", label: "Likes", type: "count" },
      { id: "comments", label: "Comments", type: "count" },
      { id: "shares", label: "Shares", type: "count" },
      { id: "saves", label: "Saves", type: "count" },
    ],
    derivedMetrics: [
      {
        id: "engagementRate", label: "Engagement rate",
        formula: "(likes + comments + shares + saves) / plays * 100", format: "percent",
      },
    ],
  },
  {
    name: "YouTube",
    platform: "YOUTUBE",
    icon: "Youtube",
    sortOrder: 5,
    metricSchema: [
      { id: "views", label: "Views", type: "count", required: true },
      { id: "watchTimeMinutes", label: "Watch time (min)", type: "duration" },
      { id: "likes", label: "Likes", type: "count" },
      { id: "comments", label: "Comments", type: "count" },
      { id: "subscribersGained", label: "Subscribers gained", type: "count" },
    ],
    derivedMetrics: [
      {
        id: "avgViewDuration", label: "Avg view duration (min)",
        formula: "watchTimeMinutes / views", format: "number",
      },
    ],
  },
  {
    name: "LinkedIn",
    platform: "LINKEDIN",
    icon: "Linkedin",
    sortOrder: 6,
    metricSchema: [
      { id: "impressions", label: "Impressions", type: "count", required: true },
      { id: "clicks", label: "Clicks", type: "count" },
      { id: "reactions", label: "Reactions", type: "count" },
      { id: "comments", label: "Comments", type: "count" },
      { id: "leads", label: "Leads", type: "count" },
    ],
    derivedMetrics: [
      { id: "ctr", label: "CTR", formula: "clicks / impressions * 100", format: "percent" },
      { id: "cpl", label: "Cost per lead", formula: "spend / leads", format: "currency" },
    ],
  },
  {
    name: "Email Campaign",
    platform: "EMAIL",
    icon: "Mail",
    sortOrder: 7,
    metricSchema: [
      { id: "sent", label: "Sent", type: "count", required: true },
      { id: "delivered", label: "Delivered", type: "count" },
      { id: "opens", label: "Opens", type: "count" },
      { id: "clicks", label: "Clicks", type: "count" },
      { id: "unsubscribes", label: "Unsubscribes", type: "count" },
    ],
    derivedMetrics: [
      { id: "openRate", label: "Open rate", formula: "opens / delivered * 100", format: "percent" },
      { id: "ctr", label: "Click rate", formula: "clicks / delivered * 100", format: "percent" },
      { id: "unsubRate", label: "Unsubscribe rate", formula: "unsubscribes / delivered * 100", format: "percent" },
    ],
  },
  {
    name: "SEO / Content",
    platform: "SEO",
    icon: "TrendingUp",
    sortOrder: 8,
    metricSchema: [
      { id: "sessions", label: "Sessions", type: "count", required: true },
      { id: "users", label: "Users", type: "count" },
      { id: "impressions", label: "Search impressions", type: "count" },
      { id: "clicks", label: "Search clicks", type: "count" },
      { id: "avgPosition", label: "Avg position", type: "count" },
      { id: "leads", label: "Leads", type: "count" },
    ],
    derivedMetrics: [
      { id: "ctr", label: "Search CTR", formula: "clicks / impressions * 100", format: "percent" },
    ],
  },
];

async function main() {
  for (const t of TYPES) {
    const existing = await prisma.campaignType.findUnique({ where: { name: t.name } });
    if (existing) {
      console.log(`= ${t.name} (already exists, left untouched)`);
      continue;
    }
    await prisma.campaignType.create({ data: t });
    console.log(`+ ${t.name}  (${t.metricSchema.length} metrics, ${t.derivedMetrics.length} derived)`);
  }
  console.log(`\nDone — ${TYPES.length} campaign types checked.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
