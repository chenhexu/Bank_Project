# ✅ AWS Setup Checklist

## 🔑 Prerequisites
- [ ] AWS Account created and billing enabled
- [ ] AWS CLI installed
- [ ] Elastic Beanstalk CLI installed (`pip install awsebcli`)
- [ ] Docker installed and running
- [ ] Git repository with BlueBank code

## ⚙️ AWS Configuration
- [ ] AWS credentials configured (`aws configure`)
- [ ] IAM roles created (see AWS_DEPLOYMENT.md)
- [ ] RDS database security group allows EB instances
- [ ] Environment variables updated in `.ebextensions/01_environment.config`

## 🚀 Deployment
- [ ] Docker image built and pushed to Docker Hub
- [ ] Elastic Beanstalk application initialized (`eb init`)
- [ ] Environment created (`eb create`)
- [ ] Application deployed (`eb deploy`)
- [ ] Application accessible via EB URL

## 🧪 Testing
- [ ] Application loads in browser
- [ ] User registration works
- [ ] Login works
- [ ] Banking operations work
- [ ] Database connection verified
- [ ] Cross-computer access confirmed

## 💰 Cost Verification
- [ ] EC2 t3.micro instance running (~$7.30/month)
- [ ] RDS PostgreSQL running (~$15/month)
- [ ] Total cost within budget (~$22.30/month)

## 📱 Next Steps
- [ ] Custom domain setup (optional)
- [ ] HTTPS certificate (optional)
- [ ] Monitoring and alerts (optional)
- [ ] Auto-scaling configuration (optional)

---

**Status**: ⏳ In Progress / ✅ Complete / ❌ Blocked

**Notes**: 
- Remember to update environment variables with real values
- Test thoroughly before sharing with users
- Monitor costs regularly 