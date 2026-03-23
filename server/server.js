import app from "./src/app.js";
import config from "./src/config/index.js";
import prisma from "./src/utils/prisma.js";
import bcrypt from "bcryptjs";

const createAccounts = async () => {

  const user = {
    email: "owner@gmail.com",
    pass: "Owner@123",
    name: "Site Owner"
  }

  const hashedPassword = await bcrypt.hash(user.pass, config.bcrypt.saltRounds);

  // Owner Account if not exists
  const owner = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      password: hashedPassword,
    },
    create: {
      email: user.email,
      password: hashedPassword,
      firstName: user.name.split(" ")[0],
      lastName: user.name.split(" ")[1],
      role: "OWNER",
      status: "ACTIVE",
      isEmailVerified: true,
    },
  });
  console.log(`  ✅ Owner created: ${owner.email}`);

}

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    await createAccounts();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} [${config.env}]`);
      console.log(`📍 Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🔄 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
