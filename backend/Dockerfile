# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Remove dev dependencies and files
RUN rm -rf node_modules && npm install --production

# Expose port
EXPOSE 5000

# Set environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "index.js"]
