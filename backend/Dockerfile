FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    clamav \
    clamav-daemon \
    freshclam

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /tmp/uploads

# Set permissions
RUN chmod 755 /tmp/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
