# Stage 1: Build the React Frontend
FROM node:22-alpine AS builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build


# Stage 2: Setup Node Backend
FROM node:22-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Copy the built frontend from Stage 1 into the location the backend expects
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Ensure the shared_folder directory exists where the backend expects it
RUN mkdir -p /app/shared_folder

# Expose the API port
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "server.js"]
