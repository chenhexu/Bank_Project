# 🚀 AWS Elastic Beanstalk Deployment Guide

This guide will walk you through deploying BlueBank to AWS Elastic Beanstalk, making it accessible from anywhere on the internet.

## 📋 Prerequisites

1. **AWS Account** with billing enabled
2. **AWS CLI** installed and configured
3. **Elastic Beanstalk CLI** installed
4. **Docker** installed and running
5. **Git** repository with your BlueBank code

## 🔧 Setup Steps

### 1. Install Required Tools

#### Install AWS CLI
```bash
# Windows (PowerShell)
winget install -e --id Amazon.AWSCLI

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### Install Elastic Beanstalk CLI
```bash
pip install awsebcli
```

### 2. Configure AWS Credentials

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: From your AWS IAM user
- **AWS Secret Access Key**: From your AWS IAM user
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

### 3. Create IAM Roles (One-time setup)

#### Create Service Role
```bash
aws iam create-role \
  --role-name aws-elasticbeanstalk-service-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "elasticbeanstalk.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-service-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService
```

#### Create EC2 Instance Profile
```bash
aws iam create-role \
  --role-name aws-elasticbeanstalk-ec2-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier

aws iam create-instance-profile \
  --instance-profile-name aws-elasticbeanstalk-ec2-role

aws iam add-role-to-instance-profile \
  --instance-profile-name aws-elasticbeanstalk-ec2-role \
  --role-name aws-elasticbeanstalk-ec2-role
```

## 🚀 Deployment

### Option 1: Using the Deployment Script (Recommended)

#### Windows (PowerShell)
```powershell
.\scripts\deploy-aws.ps1
```

#### Linux/macOS
```bash
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

### Option 2: Manual Deployment

#### 1. Build and Push Docker Image
```bash
docker build -t chenhexu/bluebank:latest .
docker push chenhexu/bluebank:latest
```

#### 2. Initialize Elastic Beanstalk
```bash
eb init bluebank --platform docker --region us-east-1
```

#### 3. Create Environment
```bash
eb create bluebank-prod --instance-type t3.micro --single-instance
```

#### 4. Deploy
```bash
eb deploy
```

## 🌐 Access Your Application

After successful deployment, you'll get a URL like:
```
http://bluebank-prod.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com
```

## 📊 Monitoring and Management

### View Application Status
```bash
eb status
```

### View Logs
```bash
eb logs
```

### Open in Browser
```bash
eb open
```

### SSH into Instance (if needed)
```bash
eb ssh
```

## 💰 Cost Breakdown

- **EC2 t3.micro**: ~$7.30/month
- **RDS PostgreSQL**: ~$15/month (already set up)
- **Data Transfer**: ~$0.09/GB (first 1GB free)
- **Total**: ~$22.30/month ✅

## 🔧 Environment Variables

Update `.ebextensions/01_environment.config` with your actual values:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    GMAIL_EMAIL: "your-actual-email@gmail.com"
    GMAIL_APP_PASSWORD: "your-actual-app-password"
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure IAM roles are created and attached
2. **Docker Build Fails**: Check Dockerfile and dependencies
3. **Environment Creation Fails**: Verify region and instance type availability
4. **Database Connection Fails**: Check security group rules for RDS

### Useful Commands

```bash
# Check EB status
eb status

# View recent events
eb events

# Check health
eb health

# Restart environment
eb restart

# Terminate environment
eb terminate
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# After making code changes
git add .
git commit -m "Update description"
eb deploy
```

### Scale Up/Down
```bash
# Change instance type
eb config
# Edit the configuration file and save
eb deploy
```

## 📱 Next Steps

1. **Custom Domain**: Set up Route 53 for a custom domain
2. **HTTPS**: Enable SSL certificate with AWS Certificate Manager
3. **Auto-scaling**: Configure auto-scaling rules for traffic spikes
4. **Monitoring**: Set up CloudWatch alarms and notifications

## 🆘 Support

If you encounter issues:
1. Check the AWS Elastic Beanstalk console
2. Review CloudWatch logs
3. Check the EB CLI logs
4. Verify IAM permissions and roles

---

**Congratulations!** 🎉 Your BlueBank application is now running in the cloud and accessible from anywhere! 