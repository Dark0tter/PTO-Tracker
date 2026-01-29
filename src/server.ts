import express from "express";
import dotenv from "dotenv";
import { buildDataSourceForTenant, resolveTenantIdFromRequest } from "./tenancy";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    multiTenant: true,
  });
});

app.get("/employees", async (_req, res) => {
  const tenantId = resolveTenantIdFromRequest(_req as any);
  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
    return;
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    res.status(501).json({ error: "Tenant connector not configured" });
    return;
  }
  try {
    const employees = await dataSource.getEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load employees", detail: err?.message });
  }
});

app.get("/divisions", async (_req, res) => {
  const tenantId = resolveTenantIdFromRequest(_req as any);
  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
    return;
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    res.status(501).json({ error: "Tenant connector not configured" });
    return;
  }
  try {
    const divisions = await dataSource.getDivisions();
    res.json(divisions);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load divisions", detail: err?.message });
  }
});

app.get("/timeoff", async (req, res) => {
  const tenantId = resolveTenantIdFromRequest(req as any);
  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant. Provide x-tenant-id header or ?tenant=..." });
    return;
  }
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    res.status(501).json({ error: "Tenant connector not configured" });
    return;
  }
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  try {
    const events = await dataSource.getTimeOffEvents({ from, to });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load time off events", detail: err?.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Vacation Tracker API listening on port ${PORT}`);
});


