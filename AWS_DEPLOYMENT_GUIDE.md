# AWS Deployment Guide - Task Manager Backend API

This guide provides step-by-step instructions to deploy your Task Manager Backend API on AWS using only the **Free Tier** services and set up a CI/CD pipeline with GitHub.

## 📋 Prerequisites

- AWS Account (Free Tier eligible)
- GitHub Account
- Node.js application (Task Manager Backend API)
- Basic understanding of AWS services

## 🏗️ Architecture Overview

```
GitHub Repository
       ↓ (GitHub Actions)
AWS CodeBuild (Free Tier)
       ↓ (Build & Deploy)
AWS Elastic Beanstalk (Free Tier)
       ↓ (Database)
MongoDB Atlas (Free Tier)
```

## 🆓 AWS Free Tier Services Used

1. **AWS Elastic Beanstalk** - Application hosting (750 hours/month)
2. **AWS CodeBuild** - CI/CD pipeline (100 build minutes/month)
3. **AWS CodePipeline** - Deployment orchestration (1 active pipeline/month)
4. **AWS S3** - Artifact storage (5GB storage)
5. **MongoDB Atlas** - Database (512MB storage)

## 📝 Step-by-Step Deployment Process

### Phase 1: GitHub Repository Setup

#### 1.1 Create GitHub Repository
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: Task Manager Backend API"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/task-manager-backend.git
git branch -M main
git push -u origin main
```

#### 1.2 Add Required Files for Deployment

Create `.ebextensions/01-nodejs.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.17.0
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
```

Create `Dockerfile` (optional, for containerized deployment):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 8080

CMD ["npm", "start"]
```

### Phase 2: MongoDB Atlas Setup (Free Tier)

#### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (M0 Sandbox - Free Tier)
4. Choose AWS as cloud provider
5. Select a region close to your AWS deployment

#### 2.2 Configure Database Access
1. **Database User:**
   - Username: `taskmanager`
   - Password: Generate secure password
   - Database User Privileges: `Read and write to any database`

2. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (for development)
   - Or add specific AWS Elastic Beanstalk IP ranges

#### 2.3 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `task-manager`

Example connection string:
```
mongodb+srv://taskmanager:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/task-manager?retryWrites=true&w=majority
```

### Phase 3: AWS Elastic Beanstalk Setup

#### 3.1 Create Elastic Beanstalk Application
1. **Login to AWS Console**
   - Go to [AWS Elastic Beanstalk](https://console.aws.amazon.com/elasticbeanstalk/)

2. **Create Application**
   - Click "Create Application"
   - Application name: `task-manager-backend`
   - Platform: `Node.js`
   - Platform branch: `Node.js 18 running on 64bit Amazon Linux 2023`
   - Platform version: Latest

3. **Configure Environment**
   - Environment name: `task-manager-prod`
   - Domain: `task-manager-backend` (or your preferred name)
   - Description: `Task Manager Backend API Production Environment`

4. **Application Code**
   - Source: `Sample application` (we'll deploy from GitHub later)

5. **Configure Service Access**
   - Service role: `Create and use new service role`
   - EC2 instance profile: `Create and use new instance profile`

6. **Set Up Networking**
   - VPC: `Default VPC`
   - Instance subnets: Select all available subnets
   - Load balancer subnets: Select all available subnets

7. **Configure Instances**
   - Instance types: `t2.micro` (Free Tier eligible)
   - Security groups: `Create new security group`

8. **Configure Capacity**
   - Environment type: `Single instance` (Free Tier)
   - Instance types: `t2.micro`

9. **Configure Rolling Updates and Deployments**
   - Deployment policy: `Rolling`
   - Rolling update type: `Immutable`

10. **Configure Monitoring**
    - Health reporting: `Enhanced`
    - Health check grace period: `300`

11. **Review and Launch**
    - Review all settings
    - Click "Create environment"

#### 3.2 Configure Environment Variables
1. Go to your Elastic Beanstalk environment
2. Click "Configuration"
3. Go to "Software" section
4. Add environment properties:
   ```
   MONGODB_URI=mongodb+srv://taskmanager:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/task-manager?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=8080
   API_BASE_URL=https://your-app-name.region.elasticbeanstalk.com/api
   ```

### Phase 4: AWS CodeBuild Setup

#### 4.1 Create CodeBuild Project
1. **Go to AWS CodeBuild Console**
   - Navigate to [AWS CodeBuild](https://console.aws.amazon.com/codebuild/)

2. **Create Build Project**
   - Project name: `task-manager-backend-build`
   - Description: `Build and test Task Manager Backend API`

3. **Source Configuration**
   - Source provider: `GitHub`
   - Repository: `Connect using OAuth` (authorize GitHub)
   - Repository URL: Select your repository
   - Source version: `refs/heads/main`

4. **Environment Configuration**
   - Environment image: `Managed image`
   - Operating system: `Ubuntu`
   - Runtime: `Standard`
   - Image: `aws/codebuild/standard:7.0`
   - Image version: `Always use the latest image for this runtime version`
   - Environment type: `Linux`
   - Compute: `aws/codebuild/standard:7.0`
   - Service role: `New service role`
   - Role name: `CodeBuildServiceRole`

5. **Buildspec Configuration**
   - Buildspec: `Use a buildspec file`

6. **Artifacts Configuration**
   - Type: `Amazon S3`
   - Bucket name: Create new bucket or use existing
   - Name: `task-manager-backend-artifacts`
   - Path: `builds`

#### 4.2 Create Buildspec File
Create `buildspec.yml` in your repository root:
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Build started on `date`
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Build started on `date`
      - echo Running tests...
      - npm test
      - echo Building the application...
      - npm run build
      - echo Build completed on `date`
  post_build:
    commands:
      - echo Build phase completed on `date`
      - echo Creating deployment package...
      - zip -r task-manager-backend.zip dist/ package.json package-lock.json .ebextensions/
artifacts:
  files:
    - 'task-manager-backend.zip'
  name: task-manager-backend-$(date +%Y-%m-%d-%H-%M-%S)
```

### Phase 5: AWS CodePipeline Setup

#### 5.1 Create CodePipeline
1. **Go to AWS CodePipeline Console**
   - Navigate to [AWS CodePipeline](https://console.aws.amazon.com/codepipeline/)

2. **Create Pipeline**
   - Pipeline name: `task-manager-backend-pipeline`
   - Service role: `New service role`
   - Role name: `CodePipelineServiceRole`

3. **Source Stage**
   - Source provider: `GitHub (Version 2)`
   - Connection: Create new connection to GitHub
   - Repository: Select your repository
   - Branch: `main`
   - Output artifact format: `CodePipeline default`

4. **Build Stage**
   - Build provider: `AWS CodeBuild`
   - Project name: `task-manager-backend-build`
   - Build type: `Single build`

5. **Deploy Stage**
   - Deploy provider: `AWS Elastic Beanstalk`
   - Application name: `task-manager-backend`
   - Environment name: `task-manager-prod`

### Phase 6: GitHub Actions Alternative (Recommended)

#### 6.1 Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS Elastic Beanstalk

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Generate deployment package
      run: |
        zip -r task-manager-backend.zip dist/ package.json package-lock.json .ebextensions/
    
    - name: Deploy to EB
      uses: einaregilsson/beanstalk-deploy@v20
      with:
        aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        application_name: task-manager-backend
        environment_name: task-manager-prod
        version_label: ${{ github.sha }}
        region: us-east-1
        deployment_package: task-manager-backend.zip
```

#### 6.2 Configure GitHub Secrets
1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add the following secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `MONGODB_URI`: Your MongoDB Atlas connection string

### Phase 7: AWS IAM Setup

#### 7.1 Create IAM User for GitHub Actions
1. **Go to AWS IAM Console**
   - Navigate to [AWS IAM](https://console.aws.amazon.com/iam/)

2. **Create User**
   - Username: `github-actions-deploy`
   - Access type: `Programmatic access`

3. **Attach Policies**
   - `AWSElasticBeanstalkFullAccess`
   - `AmazonS3FullAccess` (for artifacts)

4. **Create Access Keys**
   - Save the Access Key ID and Secret Access Key
   - Add these to GitHub Secrets

### Phase 8: Security Configuration

#### 8.1 Update Security Groups
1. Go to EC2 Console → Security Groups
2. Find the security group for your Elastic Beanstalk environment
3. Add inbound rules:
   - Type: `HTTP`, Port: `80`, Source: `0.0.0.0/0`
   - Type: `HTTPS`, Port: `443`, Source: `0.0.0.0/0`
   - Type: `Custom TCP`, Port: `8080`, Source: `0.0.0.0/0`

#### 8.2 Configure HTTPS (Optional)
1. **Request SSL Certificate**
   - Go to AWS Certificate Manager
   - Request a public certificate
   - Add your domain name

2. **Configure Load Balancer**
   - Go to Elastic Beanstalk environment
   - Configuration → Load balancer
   - Add HTTPS listener
   - Select your SSL certificate

### Phase 9: Monitoring and Logging

#### 9.1 CloudWatch Logs
1. Go to Elastic Beanstalk environment
2. Configuration → Software
3. Enable CloudWatch logs
4. Set log retention period

#### 9.2 Health Monitoring
1. Configure health check endpoint: `/health`
2. Set up CloudWatch alarms for:
   - High CPU utilization
   - High memory usage
   - Application errors

### Phase 10: Testing and Validation

#### 10.1 Test Deployment
```bash
# Test health endpoint
curl https://your-app-name.region.elasticbeanstalk.com/health

# Test API endpoints
curl https://your-app-name.region.elasticbeanstalk.com/api/tasks
```

#### 10.2 Performance Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 100 -c 10 https://your-app-name.region.elasticbeanstalk.com/health
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check buildspec.yml syntax

2. **Deployment Failures**
   - Verify environment variables are set correctly
   - Check MongoDB connection string
   - Review Elastic Beanstalk logs

3. **Database Connection Issues**
   - Verify MongoDB Atlas network access settings
   - Check connection string format
   - Ensure database user has correct permissions

### Useful Commands

```bash
# Check Elastic Beanstalk logs
eb logs

# SSH into EC2 instance
eb ssh

# Check application status
eb status

# View environment health
eb health
```

## 📊 Cost Monitoring

### Free Tier Limits
- **Elastic Beanstalk**: 750 hours/month (t2.micro)
- **CodeBuild**: 100 build minutes/month
- **CodePipeline**: 1 active pipeline/month
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **MongoDB Atlas**: 512MB storage, shared clusters

### Cost Optimization Tips
1. Use single instance deployment
2. Monitor usage in AWS Cost Explorer
3. Set up billing alerts
4. Use CloudWatch to monitor resource usage

## 🚀 Next Steps

1. **Domain Setup**: Configure custom domain with Route 53
2. **CDN**: Add CloudFront for better performance
3. **Auto Scaling**: Configure auto-scaling groups (when needed)
4. **Backup**: Set up automated database backups
5. **Monitoring**: Implement comprehensive monitoring with CloudWatch

## 📚 Additional Resources

- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## ⚠️ Important Notes

1. **Free Tier Limitations**: Monitor your usage to avoid charges
2. **Security**: Regularly update dependencies and review security settings
3. **Backup**: Implement regular database backups
4. **Monitoring**: Set up alerts for critical metrics
5. **Scaling**: Plan for scaling when your application grows

---

**Total Estimated Setup Time**: 2-3 hours
**Monthly Cost**: $0 (within Free Tier limits)
**Maintenance**: Minimal (automated deployments)

This guide ensures your Task Manager Backend API is deployed securely and efficiently on AWS using only free tier services with a robust CI/CD pipeline.
