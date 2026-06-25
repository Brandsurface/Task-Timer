FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy frontend build
COPY frontend/dist/ ./frontend/dist/

# Create data and uploads directories
RUN mkdir -p /app/data/uploads

EXPOSE 3001

CMD ["node", "server.js"]
