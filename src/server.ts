import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { buildDataSourceForTenant } from "./tenancy";
import { authenticateUser, generateToken, authMiddleware, AuthRequest, getUsers } from "./auth";

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
    authenticated: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Authentication endpoints (public)
app.post("/auth/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = await authenticateUser(username, password);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    },
  });
}));

app.get("/auth/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.get("/auth/users", authMiddleware, (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  res.json(getUsers());
});

// Protected API routes
app.get("/employees", authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenantId;
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    return res.status(501).json({ error: "Tenant connector not configured" });
  }
  const employees = await dataSource.getEmployees();
  res.json(employees);
}));

app.get("/divisions", authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenantId;
  const { dataSource } = buildDataSourceForTenant(tenantId);
  if (!dataSource) {
    return res.status(501).json({ error: "Tenant connector not configured" });
  }
  const divisions = await dataSource.getDivisions();
  res.json(divisions);
}));

app.get("/events", authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenantId;
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
  console.log(`Authentication: Enabled`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
