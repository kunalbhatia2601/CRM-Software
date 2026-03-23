import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { exec } from "child_process";
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

const app = express();

// ─── Global Middlewares ──────────────────────────────────
app.use(helmet());
app.use(
  config.env === "development"
    ? cors()
    : cors({ origin: config.cors.origin, credentials: true })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === "development") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {

  if(config.env === "development") {
    res.json({
      success: true,
      message: "OmniCore Agency Suite API is running",
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
    message: "OmniCore Agency Suite API",
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

app.get("/pullAndDeploy", (_req, res) => {
  

  if(config.env !== "production") {
    return res.status(403).send("Deployment is not allowed in development mode");
  }

  if(_req.query.secret !== config.pullAndDeploySecret) {
    return res.status(403).send("Invalid secret");
  }

  exec(
    `
    cd ~/CRM-Software &&
    git pull origin main &&
    cd server && bun install &&
    cd ../client && bun install && bun run build &&
    pm2 reload all
    `,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send("Deployment failed");
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }

      console.log(`Output: ${stdout}`);
      res.send("Deployment successful 🚀");
    }
  );

})

// ─── Error Handling ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
