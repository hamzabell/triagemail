# TriageMail Deployment Guide

This guide covers the deployment process for TriageMail across different environments.

## Prerequisites

Before deploying, ensure you have:

1. **Infrastructure Setup**
   - Cloud provider account (AWS, Google Cloud, Azure, or Railway/Vercel)
   - Domain name configured
   - SSL certificates
   - Database instance (PostgreSQL)

2. **Environment Variables**
   - All required environment variables configured
   - API keys for lemonfox.ai
   - Google OAuth credentials

3. **Security**
   - SSL certificates ready
   - Firewall rules configured
   - Monitoring and logging setup

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/google/callback"

# lemonfox.ai API
LEMONFOX_API_KEY="your-lemonfox-api-key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Frontend URL
FRONTEND_URL="https://your-domain.com"
```

### Frontend (.env.production)

```bash
VITE_API_URL="https://your-domain.com/api"
VITE_APP_URL="https://your-domain.com"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

## Deployment Options

### Option 1: Docker Compose (Local/Development)

1. **Build and Start Services**

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

2. **Database Setup**

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

3. **Access Applications**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### Option 2: Railway (Recommended for Production)

1. **Prepare Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Install Railway CLI
   - Login: `railway login`

2. **Create Railway Project**

```bash
# Initialize Railway project
railway init

# Add backend service
railway add --service backend

# Add frontend service
railway add --service frontend

# Add database service
railway add --service database
```

3. **Configure Services**

**Backend Service (railway.toml)**

```toml
[build]
command = "npm run build"

[deploy]
startCommand = "npm start"

[env]
NODE_ENV = "production"
PORT = "3001"
DATABASE_URL = "${{Postgres.DATABASE_URL}}"
```

**Frontend Service (railway.toml)**

```toml
[build]
command = "npm run build"

[deploy]
startCommand = "npm run preview"
```

4. **Deploy**

```bash
# Deploy all services
railway up

# Monitor deployment
railway logs
```

### Option 3: Vercel (Frontend) + Railway (Backend)

1. **Deploy Frontend to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Configure environment variables
vercel env add VITE_API_URL
vercel env add VITE_APP_URL
```

2. **Deploy Backend to Railway**

```bash
# Follow Railway deployment steps above
# Ensure CORS is configured for Vercel domain
```

### Option 4: AWS ECS

1. **Build and Push Docker Images**

```bash
# Build backend image
docker build -t triage-backend:latest ./backend

# Build frontend image
docker build -t triage-frontend:latest ./frontend

# Tag images
docker tag triage-backend:latest your-registry.dkr.ecr.region.amazonaws.com/triage-backend:latest
docker tag triage-frontend:latest your-registry.dkr.ecr.region.amazonaws.com/triage-frontend:latest

# Push images
docker push your-registry.dkr.ecr.region.amazonaws.com/triage-backend:latest
docker push your-registry.dkr.ecr.region.amazonaws.com/triage-frontend:latest
```

2. **Deploy to ECS**

```bash
# Update ECS service
aws ecs update-service --cluster triage-cluster --service triage-service --force-new-deployment
```

## Database Migrations

### Production Migration

```bash
# Using Prisma
cd backend
npx prisma migrate deploy

# Or using manual SQL
psql $DATABASE_URL < migrations/production.sql
```

### Rollback Plan

```bash
# Prisma rollback
npx prisma migrate rollback

# Or restore from backup
pg_restore --verbose --clean --no-acl --no-owner -h host -U user -d database backup.dump
```

## Monitoring and Logging

### Application Monitoring

```bash
# Health checks
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Logging setup (using Winston)
# Logs are stored in:
# - Backend: ./logs/combined.log
# - Cloud: CloudWatch or Railway logs
```

### Database Monitoring

```bash
# Prisma Studio
cd backend
npx prisma studio

# Database queries
psql $DATABASE_URL -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Security Configuration

### SSL/TLS

```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com

# Or use Cloudflare SSL
# Configure in Cloudflare dashboard
```

### Firewall Rules

```bash
# Example AWS Security Group
# Allow HTTP (80), HTTPS (443), SSH (22)
# Allow database connections from application servers only
```

### Rate Limiting

```bash
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

## Gmail Add-on Deployment

### Google Apps Script Deployment

1. **Open Apps Script Editor**
   - Go to [script.google.com](https://script.google.com)
   - Create new project
   - Copy files from `gmail-addon/` directory

2. **Configure Project**
   - Update `API_BASE_URL` and `API_KEY` in `Code.gs`
   - Configure OAuth consent screen
   - Set up required OAuth scopes

3. **Test Deployment**
   - Create test deployment
   - Test with sample emails
   - Verify all features work

4. **Production Deployment**
   - Create new deployment
   - Submit to Google Workspace Marketplace
   - Wait for approval (1-3 days)

## Performance Optimization

### Caching Strategy

```bash
# Redis configuration
maxmemory 256mb
maxmemory-policy allkeys-lru

# Browser caching (nginx)
expires 1y;
add_header Cache-Control "public, immutable";
```

### Database Optimization

```bash
# Connection pooling
# Configure in Prisma schema
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

# Indexes (add to Prisma schema)
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  // Add other fields...
  @@index([email])
}
```

## Backup Strategy

### Database Backups

```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated backup script
0 2 * * * /usr/bin/pg_dump $DATABASE_URL > /backups/daily-$(date +\%Y\%m\%d).sql
```

### File Backups

```bash
# Backup configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz nginx.conf .env*

# Upload to cloud storage
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-bucket/backups/
```

## Rollback Plan

### Quick Rollback

```bash
# Rollback to previous deployment
railway run --service backend "git checkout HEAD~1 && railway up"

# Or use Vercel rollback
vercel rollback --prod
```

### Database Rollback

```bash
# Restore from backup
pg_restore --verbose --clean --no-acl --no-owner -h host -U user -d database backup.dump

# Or use point-in-time recovery (if using RDS)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier production \
  --target-db-instance-identifier rollback \
  --restore-time 2024-01-01T12:00:00Z
```

## Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Database migrations successful
- [ ] SSL certificates valid
- [ ] Environment variables correct
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Gmail add-on working
- [ ] Monitoring and logging active
- [ ] Backup processes running
- [ ] Security scans passed
- [ ] Performance tests passing

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check database status
   docker-compose exec postgres pg_isready

   # Check connection string
   echo $DATABASE_URL
   ```

2. **API Connection Issues**

   ```bash
   # Check backend logs
   docker-compose logs backend

   # Test API endpoint
   curl http://localhost:3001/health
   ```

3. **Frontend Build Issues**

   ```bash
   # Clear node modules and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install

   # Check for missing dependencies
   npm audit
   ```

### Support

For deployment issues:

- Check application logs
- Review monitoring dashboards
- Consult cloud provider documentation
- Contact development team

## Maintenance

### Regular Updates

```bash
# Monthly security updates
npm update
npm audit fix

# Database maintenance
npx prisma db push
vacuumdb -z -h host -U user -d database
```

### Scaling

```bash
# Horizontal scaling (add more instances)
# Update docker-compose.yml or cloud provider settings

# Vertical scaling (increase resources)
# Update cloud provider instance sizes
```

This deployment guide provides a comprehensive approach to deploying TriageMail in production. Choose the deployment option that best fits your infrastructure and team preferences.
