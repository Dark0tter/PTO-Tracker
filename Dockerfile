# Backend Dockerfile
FROM node:20-alpine AS backend-build

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package.json ./

# Copy configuration files
COPY tenants.example.json ./tenants.example.json

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "dist/server.js"]
