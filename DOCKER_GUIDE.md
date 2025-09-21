# Docker Guide - Task Manager Backend API

This guide explains how to use Docker with your Task Manager Backend API for both development and production environments.

## 📁 Docker Files Overview

- `Dockerfile` - Production-optimized multi-stage build
- `Dockerfile.dev` - Development environment with hot reload
- `docker-compose.yml` - Production setup with MongoDB
- `docker-compose.dev.yml` - Development setup with hot reload
- `.dockerignore` - Files to exclude from Docker build context
- `mongo-init.js` - MongoDB initialization script

## 🚀 Quick Start

### Development Environment

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the application:**
   - API: http://localhost:3001
   - Health check: http://localhost:3001/health
   - MongoDB: localhost:27017

3. **Stop development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Environment

1. **Start production environment:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - API: http://localhost:3001
   - Health check: http://localhost:3001/health

3. **Stop production environment:**
   ```bash
   docker-compose down
   ```

## 🐳 Individual Docker Commands

### Build and Run Production Image

```bash
# Build the production image
docker build -t task-manager-backend .

# Run the container
docker run -p 3001:8080 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/task-manager \
  -e NODE_ENV=production \
  -e PORT=8080 \
  task-manager-backend
```

### Build and Run Development Image

```bash
# Build the development image
docker build -f Dockerfile.dev -t task-manager-backend-dev .

# Run the development container
docker run -p 3001:3001 \
  -v $(pwd)/src:/app/src \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/task-manager \
  -e NODE_ENV=development \
  task-manager-backend-dev
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | - | `mongodb://mongodb:27017/task-manager` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Server port | `3001` (dev), `8080` (prod) | `8080` |
| `API_BASE_URL` | API base URL | - | `http://localhost:3001/api` |

### Example Environment File

Create a `.env` file:
```env
MONGODB_URI=mongodb://mongodb:27017/task-manager
NODE_ENV=production
PORT=8080
API_BASE_URL=http://localhost:3001/api
```

## 📊 Docker Image Details

### Production Image Features

- **Multi-stage build** for optimized image size
- **Alpine Linux** base for security and small footprint
- **Non-root user** for security
- **Health checks** for container monitoring
- **Production dependencies only** in final image

### Image Layers

1. **Builder Stage:**
   - Node.js 18 Alpine
   - Install all dependencies
   - Build TypeScript code

2. **Production Stage:**
   - Node.js 18 Alpine
   - Install production dependencies only
   - Copy built application
   - Set up non-root user
   - Configure health checks

## 🗄️ Database Setup

### MongoDB Configuration

The Docker setup includes:

- **MongoDB 7.0** with persistent storage
- **Initialization script** with sample data
- **Database validation** for data integrity
- **Indexes** for optimal performance
- **User authentication** (development only)

### Database Initialization

The `mongo-init.js` script:
- Creates the `task-manager` database
- Sets up user authentication
- Creates collection with validation rules
- Adds performance indexes
- Inserts sample tasks

## 🔍 Health Checks

### Application Health Check

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3001/health
```

### Expected Health Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production"
}
```

## 🛠️ Development Workflow

### Hot Reload Development

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Make changes to source code** - changes are automatically reflected

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f task-manager-api-dev
   ```

### Testing in Docker

```bash
# Run tests in container
docker-compose -f docker-compose.dev.yml exec task-manager-api-dev npm test

# Run tests with coverage
docker-compose -f docker-compose.dev.yml exec task-manager-api-dev npm run test:coverage
```

## 🚀 Deployment Options

### AWS Elastic Beanstalk

The Dockerfile is optimized for AWS Elastic Beanstalk deployment:

```bash
# Build and deploy
eb init
eb create production
eb deploy
```

### AWS ECS/Fargate

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t task-manager-backend .
docker tag task-manager-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/task-manager-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/task-manager-backend:latest
```

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT/task-manager-backend
gcloud run deploy --image gcr.io/YOUR_PROJECT/task-manager-backend --platform managed
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Find process using port
   lsof -i :3001
   
   # Kill process
   kill -9 PID
   ```

2. **MongoDB Connection Issues:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   ```

3. **Build Failures:**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

### Debug Commands

```bash
# Enter running container
docker-compose exec task-manager-api bash

# View container logs
docker-compose logs -f task-manager-api

# Check container status
docker-compose ps

# Inspect container
docker inspect task-manager-backend
```

## 📈 Performance Optimization

### Image Size Optimization

- **Multi-stage build** reduces final image size
- **Alpine Linux** base image (~5MB vs ~100MB)
- **Production dependencies only** in final stage
- **Docker layer caching** for faster rebuilds

### Runtime Optimization

- **Health checks** for automatic restart
- **Resource limits** for consistent performance
- **Volume mounts** for persistent data
- **Network optimization** for container communication

## 🔒 Security Considerations

### Container Security

- **Non-root user** execution
- **Minimal base image** (Alpine Linux)
- **No unnecessary packages** in production
- **Health checks** for monitoring

### Network Security

- **Internal network** for container communication
- **Port mapping** only for necessary services
- **Environment variables** for sensitive data

## 📝 Best Practices

1. **Use specific image tags** instead of `latest`
2. **Implement health checks** for all services
3. **Use multi-stage builds** for production
4. **Keep images small** with minimal dependencies
5. **Use .dockerignore** to exclude unnecessary files
6. **Implement proper logging** for debugging
7. **Use environment variables** for configuration
8. **Regular security updates** for base images

## 🎯 Next Steps

1. **Set up CI/CD** with Docker builds
2. **Implement monitoring** with Prometheus/Grafana
3. **Add logging** with ELK stack
4. **Set up backup** for MongoDB data
5. **Implement scaling** with Docker Swarm or Kubernetes

---

**Total Docker Setup Time**: 5-10 minutes
**Image Size**: ~150MB (production), ~300MB (development)
**Startup Time**: ~30 seconds (production), ~10 seconds (development)
