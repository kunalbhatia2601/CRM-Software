import prisma from "../src/utils/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database with comprehensive data...\n");

  const hash = (pw) => bcrypt.hashSync(pw, 12);

  // ═══════════════════════════════════════════════════════════
  // 1. USERS — all 8 roles, multiple statuses
  // ═══════════════════════════════════════════════════════════
  console.log("👥 Creating users...");

  const users = await Promise.all([
    // OWNER
    prisma.user.upsert({
      where: { email: "owner@taskgo.agency" },
      update: {},
      create: {
        email: "owner@taskgo.agency",
        password: hash("Owner@123"),
        firstName: "Kunal",
        lastName: "Bhatia",
        phone: "+91 82848-34841",
        role: "OWNER",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // ADMIN
    prisma.user.upsert({
      where: { email: "admin@taskgo.agency" },
      update: {},
      create: {
        email: "admin@taskgo.agency",
        password: hash("Admin@123"),
        firstName: "Rahul",
        lastName: "Sharma",
        phone: "+91 98765-43210",
        role: "ADMIN",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // SALES_MANAGER
    prisma.user.upsert({
      where: { email: "sales@taskgo.agency" },
      update: {},
      create: {
        email: "sales@taskgo.agency",
        password: hash("Sales@123"),
        firstName: "Priya",
        lastName: "Kapoor",
        phone: "+91 98765-11111",
        role: "SALES_MANAGER",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // ACCOUNT_MANAGER
    prisma.user.upsert({
      where: { email: "accounts@taskgo.agency" },
      update: {},
      create: {
        email: "accounts@taskgo.agency",
        password: hash("Accounts@123"),
        firstName: "Ankit",
        lastName: "Verma",
        phone: "+91 98765-22222",
        role: "ACCOUNT_MANAGER",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // FINANCE_MANAGER
    prisma.user.upsert({
      where: { email: "finance@taskgo.agency" },
      update: {},
      create: {
        email: "finance@taskgo.agency",
        password: hash("Finance@123"),
        firstName: "Sneha",
        lastName: "Gupta",
        phone: "+91 98765-33333",
        role: "FINANCE_MANAGER",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // HR
    prisma.user.upsert({
      where: { email: "hr@taskgo.agency" },
      update: {},
      create: {
        email: "hr@taskgo.agency",
        password: hash("Hr@12345"),
        firstName: "Meera",
        lastName: "Patel",
        phone: "+91 98765-44444",
        role: "HR",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // EMPLOYEE (Active)
    prisma.user.upsert({
      where: { email: "dev1@taskgo.agency" },
      update: {},
      create: {
        email: "dev1@taskgo.agency",
        password: hash("Dev@12345"),
        firstName: "Arjun",
        lastName: "Singh",
        phone: "+91 98765-55555",
        role: "EMPLOYEE",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // EMPLOYEE (Inactive)
    prisma.user.upsert({
      where: { email: "dev2@taskgo.agency" },
      update: {},
      create: {
        email: "dev2@taskgo.agency",
        password: hash("Dev@12345"),
        firstName: "Ravi",
        lastName: "Kumar",
        role: "EMPLOYEE",
        status: "INACTIVE",
        isEmailVerified: true,
      },
    }),
    // EMPLOYEE (Suspended)
    prisma.user.upsert({
      where: { email: "dev3@taskgo.agency" },
      update: {},
      create: {
        email: "dev3@taskgo.agency",
        password: hash("Dev@12345"),
        firstName: "Vikram",
        lastName: "Joshi",
        role: "EMPLOYEE",
        status: "SUSPENDED",
        isEmailVerified: false,
      },
    }),
    // EMPLOYEE (Invited)
    prisma.user.upsert({
      where: { email: "dev4@taskgo.agency" },
      update: {},
      create: {
        email: "dev4@taskgo.agency",
        password: hash("Dev@12345"),
        firstName: "Nisha",
        lastName: "Reddy",
        role: "EMPLOYEE",
        status: "INVITED",
        isEmailVerified: false,
      },
    }),
    // CLIENT user
    prisma.user.upsert({
      where: { email: "client@infosync.in" },
      update: {},
      create: {
        email: "client@infosync.in",
        password: hash("Client@123"),
        firstName: "Deepak",
        lastName: "Malhotra",
        phone: "+91 98765-66666",
        role: "CLIENT",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
    // Second CLIENT user
    prisma.user.upsert({
      where: { email: "client@globex.com" },
      update: {},
      create: {
        email: "client@globex.com",
        password: hash("Client@123"),
        firstName: "Sarah",
        lastName: "Mitchell",
        phone: "+1 555-0101",
        role: "CLIENT",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    }),
  ]);

  const [owner, admin, salesMgr, accountMgr, financeMgr, hr, emp1, emp2, emp3, emp4, clientUser1, clientUser2] = users;
  console.log(`  ✅ ${users.length} users created\n`);

  // ═══════════════════════════════════════════════════════════
  // 2. LEADS — all statuses, sources, priorities
  // ═══════════════════════════════════════════════════════════
  console.log("🎯 Creating leads...");

  // Helper: stagger dates over last 60 days
  const daysAgo = (d) => new Date(Date.now() - d * 86400000);

  const leadsData = [
    // ── NEW leads (various sources & priorities) ──
    {
      companyName: "TechNova Solutions",
      contactName: "Amit Saxena",
      email: "amit@technova.in",
      phone: "+91 99111-00001",
      source: "WEBSITE",
      status: "NEW",
      priority: "HIGH",
      estimatedValue: 250000,
      notes: "Interested in full digital transformation project.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(2),
    },
    {
      companyName: "GreenLeaf Organics",
      contactName: "Pooja Deshmukh",
      email: "pooja@greenleaf.co",
      phone: "+91 99111-00002",
      source: "REFERRAL",
      status: "NEW",
      priority: "MEDIUM",
      estimatedValue: 80000,
      notes: "Referral from Deepak at InfoSync. Needs e-commerce setup.",
      createdById: salesMgr.id,
      createdAt: daysAgo(1),
    },
    {
      companyName: "UrbanNest Realty",
      contactName: "Karan Mehta",
      email: "karan@urbannest.in",
      source: "SOCIAL_MEDIA",
      status: "NEW",
      priority: "LOW",
      estimatedValue: 50000,
      createdById: admin.id,
      createdAt: daysAgo(0),
    },

    // ── CONTACTED leads ──
    {
      companyName: "BlueSky Aviation",
      contactName: "Capt. Rajiv Nair",
      email: "rajiv@bluesky.aero",
      phone: "+91 99111-00003",
      source: "COLD_CALL",
      status: "CONTACTED",
      priority: "HIGH",
      estimatedValue: 500000,
      notes: "Discussed fleet management dashboard. Follow-up scheduled.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      followUpAt: daysAgo(-3),
      createdAt: daysAgo(10),
    },
    {
      companyName: "SpiceRoute Foods",
      contactName: "Neha Agarwal",
      email: "neha@spiceroute.in",
      source: "EMAIL_CAMPAIGN",
      status: "CONTACTED",
      priority: "MEDIUM",
      estimatedValue: 120000,
      assigneeId: salesMgr.id,
      createdById: salesMgr.id,
      createdAt: daysAgo(8),
    },

    // ── QUALIFIED leads (these can become Deals) ──
    {
      companyName: "InfoSync Technologies",
      contactName: "Deepak Malhotra",
      email: "deepak@infosync.in",
      phone: "+91 98765-66666",
      source: "REFERRAL",
      status: "QUALIFIED",
      priority: "HIGH",
      estimatedValue: 350000,
      notes: "Ready for proposal. Wants CRM + internal portal.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(20),
    },
    {
      companyName: "Globex International",
      contactName: "Sarah Mitchell",
      email: "sarah@globex.com",
      phone: "+1 555-0101",
      source: "EVENT",
      status: "QUALIFIED",
      priority: "URGENT",
      estimatedValue: 750000,
      notes: "Met at TechSummit 2026. Enterprise SaaS rebuild.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(18),
    },
    {
      companyName: "CloudPeak Media",
      contactName: "Ritu Sharma",
      email: "ritu@cloudpeak.io",
      source: "PARTNER",
      status: "QUALIFIED",
      priority: "MEDIUM",
      estimatedValue: 180000,
      notes: "Partner referral. Video streaming platform.",
      assigneeId: salesMgr.id,
      createdById: admin.id,
      createdAt: daysAgo(15),
    },

    // ── UNQUALIFIED leads ──
    {
      companyName: "BudgetPrint Co",
      contactName: "Sanjay Tiwari",
      email: "sanjay@budgetprint.in",
      source: "ADVERTISEMENT",
      status: "UNQUALIFIED",
      priority: "LOW",
      estimatedValue: 15000,
      notes: "Budget too low. Not a good fit for our services.",
      createdById: salesMgr.id,
      createdAt: daysAgo(25),
    },

    // ── CONVERTED leads (already became Deals) ──
    {
      companyName: "MetroHealth Clinics",
      contactName: "Dr. Anil Chopra",
      email: "anil@metrohealth.in",
      phone: "+91 99111-00010",
      source: "WEBSITE",
      status: "CONVERTED",
      priority: "HIGH",
      estimatedValue: 420000,
      notes: "Converted to deal. Patient management system.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      convertedAt: daysAgo(5),
      createdAt: daysAgo(30),
    },
    {
      companyName: "SwiftLogistics Pvt Ltd",
      contactName: "Manish Oberoi",
      email: "manish@swiftlogistics.in",
      phone: "+91 99111-00011",
      source: "COLD_CALL",
      status: "CONVERTED",
      priority: "URGENT",
      estimatedValue: 600000,
      notes: "Converted. Full logistics tracking platform.",
      assigneeId: salesMgr.id,
      createdById: owner.id,
      convertedAt: daysAgo(10),
      createdAt: daysAgo(45),
    },
    {
      companyName: "EduBright Academy",
      contactName: "Kavita Jain",
      email: "kavita@edubright.in",
      source: "SOCIAL_MEDIA",
      status: "CONVERTED",
      priority: "MEDIUM",
      estimatedValue: 200000,
      notes: "Converted. LMS platform needed.",
      assigneeId: salesMgr.id,
      createdById: salesMgr.id,
      convertedAt: daysAgo(2),
      createdAt: daysAgo(35),
    },

    // ── LOST leads ──
    {
      companyName: "OldGuard Industries",
      contactName: "Ramesh Sinha",
      email: "ramesh@oldguard.co.in",
      source: "OTHER",
      status: "LOST",
      priority: "LOW",
      estimatedValue: 75000,
      lostReason: "Went with a cheaper competitor.",
      createdById: salesMgr.id,
      createdAt: daysAgo(40),
    },
    {
      companyName: "QuickByte Snacks",
      contactName: "Tanya Roy",
      email: "tanya@quickbyte.in",
      source: "WEBSITE",
      status: "LOST",
      priority: "MEDIUM",
      estimatedValue: 95000,
      lostReason: "Project put on indefinite hold by client.",
      assigneeId: salesMgr.id,
      createdById: admin.id,
      createdAt: daysAgo(50),
    },
  ];

  const leads = [];
  for (const data of leadsData) {
    const lead = await prisma.lead.upsert({
      where: {
        email_companyName: {
          email: data.email,
          companyName: data.companyName,
        },
      },
      update: {},
      create: data,
    });
    leads.push(lead);
  }
  console.log(`  ✅ ${leads.length} leads created\n`);

  // Index key leads for deals
  const leadInfoSync = leads[5];     // QUALIFIED — InfoSync
  const leadGlobex = leads[6];       // QUALIFIED — Globex
  const leadCloudPeak = leads[7];    // QUALIFIED — CloudPeak
  const leadMetroHealth = leads[9];  // CONVERTED — MetroHealth
  const leadSwift = leads[10];       // CONVERTED — SwiftLogistics
  const leadEduBright = leads[11];   // CONVERTED — EduBright

  // ═══════════════════════════════════════════════════════════
  // 3. DEALS — all stages
  // ═══════════════════════════════════════════════════════════
  console.log("🤝 Creating deals...");

  // DISCOVERY stage
  const dealInfoSync = await prisma.deal.upsert({
    where: { leadId: leadInfoSync.id },
    update: {},
    create: {
      title: "InfoSync CRM & Portal",
      value: 350000,
      stage: "DISCOVERY",
      expectedCloseAt: daysAgo(-30),
      notes: "Initial discovery call done. Requirement gathering phase.",
      leadId: leadInfoSync.id,
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(14),
    },
  });

  // PROPOSAL stage
  const dealGlobex = await prisma.deal.upsert({
    where: { leadId: leadGlobex.id },
    update: {},
    create: {
      title: "Globex Enterprise SaaS Rebuild",
      value: 750000,
      stage: "PROPOSAL",
      expectedCloseAt: daysAgo(-20),
      notes: "Proposal sent. Awaiting CTO review.",
      leadId: leadGlobex.id,
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(12),
    },
  });

  // NEGOTIATION stage
  const dealCloudPeak = await prisma.deal.upsert({
    where: { leadId: leadCloudPeak.id },
    update: {},
    create: {
      title: "CloudPeak Streaming Platform",
      value: 180000,
      stage: "NEGOTIATION",
      expectedCloseAt: daysAgo(-10),
      notes: "Negotiating timeline and payment milestones.",
      leadId: leadCloudPeak.id,
      assigneeId: salesMgr.id,
      createdById: admin.id,
      createdAt: daysAgo(10),
    },
  });

  // WON deals — these get Clients + Projects
  const dealMetroHealth = await prisma.deal.upsert({
    where: { leadId: leadMetroHealth.id },
    update: {},
    create: {
      title: "MetroHealth Patient Management System",
      value: 420000,
      stage: "WON",
      wonAt: daysAgo(3),
      notes: "Deal closed! Starting project kickoff.",
      leadId: leadMetroHealth.id,
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(25),
    },
  });

  const dealSwift = await prisma.deal.upsert({
    where: { leadId: leadSwift.id },
    update: {},
    create: {
      title: "SwiftLogistics Tracking Platform",
      value: 600000,
      stage: "WON",
      wonAt: daysAgo(8),
      notes: "Won. Enterprise contract signed.",
      leadId: leadSwift.id,
      assigneeId: salesMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(40),
    },
  });

  // LOST deal
  const dealEduBright = await prisma.deal.upsert({
    where: { leadId: leadEduBright.id },
    update: {},
    create: {
      title: "EduBright LMS Platform",
      value: 200000,
      stage: "LOST",
      lostReason: "Client decided to build in-house.",
      notes: "Lost after negotiation. Price was not the issue.",
      leadId: leadEduBright.id,
      assigneeId: salesMgr.id,
      createdById: salesMgr.id,
      createdAt: daysAgo(30),
    },
  });

  const deals = [dealInfoSync, dealGlobex, dealCloudPeak, dealMetroHealth, dealSwift, dealEduBright];
  console.log(`  ✅ ${deals.length} deals created\n`);

  // ═══════════════════════════════════════════════════════════
  // 4. CLIENTS — all statuses, some from WON deals, some manual
  // ═══════════════════════════════════════════════════════════
  console.log("🏢 Creating clients...");

  // Client from WON deal — MetroHealth (ACTIVE)
  const clientMetro = await prisma.client.upsert({
    where: { email: "billing@metrohealth.in" },
    update: {},
    create: {
      companyName: "MetroHealth Clinics",
      contactName: "Dr. Anil Chopra",
      email: "billing@metrohealth.in",
      phone: "+91 99111-00010",
      address: "Sector 17, Chandigarh, India",
      industry: "Healthcare",
      website: "https://metrohealth.in",
      status: "ACTIVE",
      notes: "Premium client. 3-clinic chain.",
      dealId: dealMetroHealth.id,
      accountManagerId: accountMgr.id,
      createdAt: daysAgo(3),
    },
  });

  // Client from WON deal — SwiftLogistics (ACTIVE)
  const clientSwift = await prisma.client.upsert({
    where: { email: "ops@swiftlogistics.in" },
    update: {},
    create: {
      companyName: "SwiftLogistics Pvt Ltd",
      contactName: "Manish Oberoi",
      email: "ops@swiftlogistics.in",
      phone: "+91 99111-00011",
      address: "Noida, UP, India",
      industry: "Logistics & Supply Chain",
      website: "https://swiftlogistics.in",
      status: "ACTIVE",
      notes: "Large enterprise. Multi-phase project.",
      dealId: dealSwift.id,
      accountManagerId: accountMgr.id,
      createdAt: daysAgo(8),
    },
  });

  // Manual client — no deal (ACTIVE)
  const clientPinnacle = await prisma.client.upsert({
    where: { email: "hello@pinnacledesign.in" },
    update: {},
    create: {
      companyName: "Pinnacle Design Studio",
      contactName: "Rhea Malhotra",
      email: "hello@pinnacledesign.in",
      phone: "+91 99111-00020",
      address: "Mumbai, Maharashtra, India",
      industry: "Design & Creative",
      website: "https://pinnacledesign.in",
      status: "ACTIVE",
      notes: "Long-term retainer client since 2024.",
      accountManagerId: accountMgr.id,
      createdAt: daysAgo(120),
    },
  });

  // INACTIVE client
  const clientNova = await prisma.client.upsert({
    where: { email: "admin@novafintech.com" },
    update: {},
    create: {
      companyName: "Nova FinTech",
      contactName: "Varun Sethi",
      email: "admin@novafintech.com",
      phone: "+91 99111-00030",
      address: "Bangalore, Karnataka, India",
      industry: "FinTech",
      status: "INACTIVE",
      notes: "Project completed. No ongoing engagement.",
      accountManagerId: accountMgr.id,
      createdAt: daysAgo(180),
    },
  });

  // CHURNED client
  const clientOcean = await prisma.client.upsert({
    where: { email: "contact@oceanview.travel" },
    update: {},
    create: {
      companyName: "OceanView Travels",
      contactName: "Siddharth Rana",
      email: "contact@oceanview.travel",
      phone: "+91 99111-00040",
      address: "Goa, India",
      industry: "Travel & Hospitality",
      status: "CHURNED",
      notes: "Churned due to internal budget cuts.",
      createdAt: daysAgo(200),
    },
  });

  const clients = [clientMetro, clientSwift, clientPinnacle, clientNova, clientOcean];
  console.log(`  ✅ ${clients.length} clients created\n`);

  // ═══════════════════════════════════════════════════════════
  // 5. PROJECTS — all statuses
  // ═══════════════════════════════════════════════════════════
  console.log("📁 Creating projects...");

  const projectsData = [
    // NOT_STARTED
    {
      name: "MetroHealth Patient Portal",
      description: "Patient-facing web portal for appointment booking, records, and billing.",
      status: "NOT_STARTED",
      startDate: daysAgo(-5),
      endDate: daysAgo(-95),
      budget: 420000,
      clientId: clientMetro.id,
      dealId: dealMetroHealth.id,
      accountManagerId: accountMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(3),
    },
    // IN_PROGRESS
    {
      name: "SwiftLogistics Fleet Tracker",
      description: "Real-time fleet tracking dashboard with GPS, route optimization, and driver management.",
      status: "IN_PROGRESS",
      startDate: daysAgo(5),
      endDate: daysAgo(-85),
      budget: 600000,
      clientId: clientSwift.id,
      dealId: dealSwift.id,
      accountManagerId: accountMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(8),
    },
    // IN_PROGRESS (manual, no deal)
    {
      name: "Pinnacle Brand Redesign Website",
      description: "Complete website redesign with new branding, portfolio showcase, and blog.",
      status: "IN_PROGRESS",
      startDate: daysAgo(30),
      endDate: daysAgo(-15),
      budget: 150000,
      clientId: clientPinnacle.id,
      accountManagerId: accountMgr.id,
      createdById: admin.id,
      createdAt: daysAgo(35),
    },
    // ON_HOLD
    {
      name: "Pinnacle SEO Optimization",
      description: "6-month SEO sprint. On hold pending brand redesign completion.",
      status: "ON_HOLD",
      startDate: daysAgo(10),
      endDate: daysAgo(-170),
      budget: 90000,
      clientId: clientPinnacle.id,
      accountManagerId: accountMgr.id,
      createdById: admin.id,
      createdAt: daysAgo(20),
    },
    // COMPLETED
    {
      name: "Nova FinTech Mobile App",
      description: "Cross-platform mobile app for personal finance management. Delivered successfully.",
      status: "COMPLETED",
      startDate: daysAgo(210),
      endDate: daysAgo(160),
      budget: 350000,
      clientId: clientNova.id,
      accountManagerId: accountMgr.id,
      createdById: owner.id,
      createdAt: daysAgo(220),
    },
    // COMPLETED
    {
      name: "OceanView Booking Engine",
      description: "Custom booking engine with payment gateway integration for hotel and tour packages.",
      status: "COMPLETED",
      startDate: daysAgo(250),
      endDate: daysAgo(190),
      budget: 280000,
      clientId: clientOcean.id,
      createdById: owner.id,
      createdAt: daysAgo(260),
    },
    // CANCELLED
    {
      name: "OceanView Loyalty Program",
      description: "Loyalty rewards platform. Cancelled due to client budget cuts.",
      status: "CANCELLED",
      startDate: daysAgo(180),
      budget: 120000,
      notes: "Client churned before project could start.",
      clientId: clientOcean.id,
      createdById: admin.id,
      createdAt: daysAgo(185),
    },
  ];

  const projects = [];
  for (const data of projectsData) {
    const project = await prisma.project.create({ data });
    projects.push(project);
  }
  console.log(`  ✅ ${projects.length} projects created\n`);

  // ═══════════════════════════════════════════════════════════
  // 6. SITE CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  console.log("⚙️  Configuring site...");

  await prisma.site.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "TaskGo Agency",
      logo: "/logo.svg",
      contactEmail: "hello@taskgo.agency",
      contactPhone: "+91 82848-34841",
      address: "Chandigarh, India",
      currency: "INR",
      usdToInr: 92,
      eurToInr: 105,
      isMaintenanceMode: false,
      isDemoMode: false,
    },
  });
  console.log("  ✅ Site config set\n");

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 Seeding completed! Summary:");
  console.log("═══════════════════════════════════════════════════");
  console.log(`   👥 Users:    ${users.length}  (all 8 roles, 4 statuses)`);
  console.log(`   🎯 Leads:    ${leads.length}  (all 6 statuses, all sources & priorities)`);
  console.log(`   🤝 Deals:    ${deals.length}  (all 5 stages)`);
  console.log(`   🏢 Clients:  ${clients.length}  (all 3 statuses)`);
  console.log(`   📁 Projects: ${projects.length}  (all 5 statuses)`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\n📋 Login Credentials:");
  console.log("   Owner           → owner@taskgo.agency    / Owner@123");
  console.log("   Admin           → admin@taskgo.agency    / Admin@123");
  console.log("   Sales Manager   → sales@taskgo.agency    / Sales@123");
  console.log("   Account Manager → accounts@taskgo.agency / Accounts@123");
  console.log("   Finance Manager → finance@taskgo.agency  / Finance@123");
  console.log("   HR              → hr@taskgo.agency       / Hr@12345");
  console.log("   Employee        → dev1@taskgo.agency     / Dev@12345");
  console.log("   Client          → client@infosync.in     / Client@123");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
