FROM node:18-alpine

WORKDIR /app

# Copy backend package files into /app/backend so `cd backend` works
COPY backend/package*.json ./backend/

# Install dependencies inside /app/backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copy the rest of the backend source
WORKDIR /app
COPY backend/ ./backend/

# Create database directory (for local SQLite fallback)
RUN mkdir -p /app/database

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start app — works whether Railway runs the Dockerfile CMD or a `cd backend && npm start` override
WORKDIR /app/backend
CMD ["npm", "start"]
