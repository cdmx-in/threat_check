# ThreatCheck API - Production Deployment Guide

This guide covers deploying the ThreatCheck API in a production environment.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM (2GB for ClamAV, 1GB for PostgreSQL, 1GB for API)
- 20GB disk space (for virus definitions and logs)
- Linux server (Ubuntu 20.04+ recommended)

## Quick Production Deployment

### 1. Clone and Setup

```bash
git clone <repository-url>
cd clamscan-api

# Copy production environment file
cp .env .env.production

# Edit production settings
nano .env.production
```

### 2. Production Environment Variables

Update `.env.production` with production values:

```env
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=threatcheck_prod
DB_USER=threatcheck_prod_user
DB_PASSWORD=your_secure_password_here

# ClamAV Configuration
CLAM_HOST=clamav
CLAM_PORT=3310

# Security Settings
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
UPLOAD_RATE_LIMIT_MAX=50  # uploads per window
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  threatcheck-api:
    build: .
    container_name: threatcheck-api-prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=threatcheck_prod
      - DB_USER=threatcheck_prod_user
      - DB_PASSWORD=${DB_PASSWORD}
      - CLAM_HOST=clamav
      - CLAM_PORT=3310
    volumes:
      - ./uploads:/tmp/uploads
      - ./logs:/app/logs
    depends_on:
      - postgres
      - clamav
    networks:
      - threatcheck-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: threatcheck-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: threatcheck_prod
      POSTGRES_USER: threatcheck_prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./backups:/backups
    networks:
      - threatcheck-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U threatcheck_prod_user -d threatcheck_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  clamav:
    image: clamav/clamav:latest
    container_name: threatcheck-clamav-prod
    restart: unless-stopped
    volumes:
      - clamav_prod_data:/var/lib/clamav
    networks:
      - threatcheck-network
    healthcheck:
      test: ["CMD", "clamdstat", "--ping"]
      interval: 60s
      timeout: 30s
      retries: 5
      start_period: 300s

  nginx:
    image: nginx:alpine
    container_name: threatcheck-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - threatcheck-api
    networks:
      - threatcheck-network

volumes:
  postgres_prod_data:
  clamav_prod_data:

networks:
  threatcheck-network:
    driver: bridge
```

### 4. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream threatcheck_api {
        server threatcheck-api-prod:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # File upload size limit
        client_max_body_size 100M;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://threatcheck_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File upload endpoints with stricter limits
        location ~ ^/api/scan/(file|files)$ {
            limit_req zone=upload burst=10 nodelay;
            proxy_pass http://threatcheck_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
        }

        # Other endpoints
        location / {
            proxy_pass http://threatcheck_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. Deploy to Production

```bash
# Set production password
export DB_PASSWORD="your_secure_password_here"

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f threatcheck-api
```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check service health
curl http://your-domain.com/health

# Check metrics
curl http://your-domain.com/metrics

# View detailed logs
docker-compose -f docker-compose.prod.yml logs threatcheck-api
```

### Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec threatcheck-postgres-prod pg_dump -U threatcheck_prod_user threatcheck_prod > backups/backup_$DATE.sql
find backups/ -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Setup cron job for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### Log Rotation

```bash
# Setup logrotate
cat > /etc/logrotate.d/threatcheck << 'EOF'
/var/lib/docker/containers/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF
```

### Virus Definition Updates

ClamAV automatically updates virus definitions. Monitor the logs:

```bash
docker-compose -f docker-compose.prod.yml logs clamav | grep -i "update"
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 2. SSL/TLS Certificate

```bash
# Using Let's Encrypt with certbot
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 3. Container Security

```bash
# Run containers as non-root user
# Update Dockerfile:
RUN addgroup -g 1001 -S threatcheck && \
    adduser -u 1001 -S threatcheck -G threatcheck
USER threatcheck
```

## Performance Tuning

### 1. Database Optimization

```sql
-- Connect to PostgreSQL and run:
-- Increase shared_buffers for better performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

### 2. Application Optimization

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
```

### 3. ClamAV Optimization

```bash
# Add to clamav configuration
echo "MaxThreads 4" >> /etc/clamav/clamd.conf
echo "MaxConnectionQueueLength 30" >> /etc/clamav/clamd.conf
```

## Troubleshooting

### Common Issues

1. **ClamAV not starting**: Check if virus definitions are downloading
2. **High memory usage**: Monitor with `docker stats`
3. **Database connection issues**: Check PostgreSQL logs
4. **File upload errors**: Check disk space and permissions

### Debugging Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl -f http://localhost/health
```

## Scaling

### Horizontal Scaling

```yaml
# Add to docker-compose.prod.yml
services:
  threatcheck-api:
    deploy:
      replicas: 3
    # ... other configuration
```

### Load Balancer Configuration

```nginx
upstream threatcheck_api {
    server threatcheck-api-1:3000;
    server threatcheck-api-2:3000;
    server threatcheck-api-3:3000;
}
```

## Backup and Recovery

### Full System Backup

```bash
#!/bin/bash
# backup_system.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/system_$DATE"

mkdir -p $BACKUP_DIR

# Backup database
docker exec threatcheck-postgres-prod pg_dump -U threatcheck_prod_user threatcheck_prod > $BACKUP_DIR/database.sql

# Backup Docker volumes
docker run --rm -v postgres_prod_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v clamav_prod_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/clamav_data.tar.gz -C /data .

# Backup configuration
cp -r . $BACKUP_DIR/config
```

### Recovery Process

```bash
#!/bin/bash
# recovery.sh
BACKUP_DIR="$1"

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
docker run --rm -v postgres_prod_data:/data -v $BACKUP_DIR:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data

# Restore ClamAV data
docker run --rm -v clamav_prod_data:/data -v $BACKUP_DIR:/backup alpine tar xzf /backup/clamav_data.tar.gz -C /data

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

This production deployment guide ensures a robust, secure, and scalable ThreatCheck API deployment.
