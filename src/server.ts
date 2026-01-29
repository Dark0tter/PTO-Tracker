import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { buildDataSourceForTenant, resolveTenantIdFromRequest } from "./tenancy";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Error handling wrapper
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    multiTenant: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});Handler(async (req, res) => {
  const tenantId = resolveTenantIdFromRequest(req as any);
  if (!tenantId) {
    return res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    return res.status(501).json({ error: "Tenant connector not configured" });
  }
  const employees = await dataSource.getEmployees();
  res.json(employees);
})   res.status(500).json({ error: "Failed to load employees", detail: err?.message });
  }
});

app.get("/divisions", async (_req, res) => {
  const tenantId = resolveTenantIdFromRequest(_req as any);
  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
    return;
  }
  const { dataSource } = buHandler(async (req, res) => {
  const tenantId = resolveTenantIdFromRequest(req as any);
  if (!tenantId) {
    return res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    return res.status(501).json({ error: "Tenant connector not configured" });
  }
  const divisions = await dataSource.getDivisions();
  res.json(divisions);
})   return;
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    res.status(501).json({ error: "Tenant connector not configured" });
    return;
  }
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.toHandler(async (req, res) => {
  const tenantId = resolveTenantIdFromRequest(req as any);
  if (!tenantId) {
    return res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    return res.status(501).json({ error: "Tenant connector not configured" });
  }
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const events = await dataSource.getTimeOffEvents({ from, to });
  res.json(events);
}));

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack || err.message || err}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Vacation Tracker API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health