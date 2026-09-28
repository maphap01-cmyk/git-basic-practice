# Node.js Alpine for minimal footprint & security hardening
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root app user for container hardening
USER node

EXPOSE 3000

CMD ["node", "server.js"]
