import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import config from "./config/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import siteRoutes from "./modules/site/site.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import leadRoutes from "./modules/lead/lead.routes.js";
import dealRoutes from "./modules/deal/deal.routes.js";
import clientRoutes from "./modules/client/client.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import emailTemplateRoutes from "./modules/email-template/email-template.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import storageRoutes from "./modules/storage/storage.routes.js";
import teamRoutes from "./modules/team/team.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import systemPromptRoutes from "./modules/system-prompt/system-prompt.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import documentRoutes from "./modules/document/document.routes.js";
import meetingRoutes from "./modules/meeting/meeting.routes.js";
import followUpRoutes from "./modules/follow-up/follow-up.routes.js";
import sampleRoutes from "./modules/sample/sample.routes.js";

const app = express();

// ─── Global Middlewares ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use("/public", express.static("public"));
app.use(
  cors({
    origin: config.env === "development" ? true : config.cors.origin,
    credentials: true,
  })
);

// Skip body parsing for local file upload (streaming raw body to disk)
app.use((req, res, next) => {
  if (req.path === "/api/storage/upload/local") return next();
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === "/api/storage/upload/local") return next();
  express.urlencoded({ extended: true })(req, res, next);
});

if (config.env === "development") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {

  if (config.env === "development") {
    res.json({
      success: true,
      message: "TaskGo Agency API is running",
      environment: config.env,
      timestamp: new Date().toISOString(),
    });
  }
  else {
    res.redirect(config.cors.origin)
  }
});

// ─── Health Check ────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "HEALTHY",
    message: "TaskGo Agency API",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/email-templates", emailTemplateRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/system-prompts", systemPromptRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/samples", sampleRoutes);

app.get("/pullAndDeploy", async (_req, res) => {


  if (config.env !== "production") {
    return res.status(403).send("Deployment is not allowed in development mode");
  }

  if (_req.query.secret !== config.pullAndDeploySecret) {
    return res.status(403).send("Invalid secret");
  }

  try {

    console.log("Deploying Client...");

    const clientResult = await execAsync(
      `cd ~/CRM-Software &&
       git pull origin main &&
       cd client && bun install && bun run build &&
       pm2 reload crm-client`
    );
    console.log("Client deploy stdout:", clientResult.stdout);
    if (clientResult.stderr) console.error("Client deploy stderr:", clientResult.stderr);

    console.log("Deploying Server...");

    const serverResult = await execAsync(
      `cd ~/CRM-Software &&
       cd server && bun install &&
       bun x prisma db push && bun x prisma generate &&
       pm2 reload crm-api`
    );
    console.log("Server deploy stdout:", serverResult.stdout);
    if (serverResult.stderr) console.error("Server deploy stderr:", serverResult.stderr);

    res.send("Deployment successful 🚀");
  }
  catch (error) {
    console.error("Deployment failed:", error.message);
    if (error.stdout) console.error("stdout:", error.stdout);
    if (error.stderr) console.error("stderr:", error.stderr);
    return res.status(500).send(`Deployment failed: ${error.message}`);
  }

})

// ─── Error Handling ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
