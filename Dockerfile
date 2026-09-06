# Use official lightweight Node.js image
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend and bundle backend server
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json ./
RUN npm install --production

# Copy built assets and bundled server from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT (default 3000)
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start the Express server
CMD ["node", "dist/server.cjs"]
