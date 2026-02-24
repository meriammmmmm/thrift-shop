# ✅ Student Pack Deployment Checklist

## 🎯 Complete Deployment Checklist

Use this checklist to track your deployment progress.

---

## PHASE 1: CLAIM STUDENT BENEFITS

### GitHub Student Pack
- [ ] Applied for GitHub Student Pack at https://education.github.com/pack
- [ ] Received approval email (usually 1-3 days)
- [ ] Verified student benefits are active

### DigitalOcean ($200 Credit)
- [ ] Visited https://www.digitalocean.com/github-students
- [ ] Created DigitalOcean account with GitHub
- [ ] Verified $200 credit is applied
- [ ] Credit expiry date noted: _______________

### Namecheap (Free Domain)
- [ ] Visited https://nc.me/
- [ ] Registered free .me domain
- [ ] Domain name: _______________.me
- [ ] Domain expiry date: _______________

### Vercel (Free Hosting)
- [ ] Created Vercel account at https://vercel.com
- [ ] Connected GitHub account
- [ ] Verified free tier is active

---

## PHASE 2: PREPARE PROJECT

### Local Testing
- [ ] Tested backend locally: `cd backend && npm start`
- [ ] Tested admin panel locally: `cd admin-panel && npm start`
- [ ] Tested customer site locally: `cd thrift-shop && npm run dev`
- [ ] All features working correctly

### Environment Configuration
- [ ] Updated JWT_SECRET in backend/.env
- [ ] Configured OpenAI API key (if using AI features)
- [ ] Updated company information in .env.company* files
- [ ] Noted domain name for API URLs

### Code Repository
- [ ] Code pushed to GitHub
- [ ] Repository is private (free with student pack)
- [ ] .env files are in .gitignore
- [ ] README.md is updated

---

## PHASE 3: DIGITALOCEAN SETUP

### Create Droplet
- [ ] Logged into DigitalOcean
- [ ] Created new Droplet with these settings:
  - [ ] Image: Ubuntu 22.04 LTS
  - [ ] Plan: Basic $6/month
  - [ ] CPU: Regular (1GB RAM)
  - [ ] Datacenter region: _______________
  - [ ] Authentication: SSH Key added
- [ ] Server IP address: _______________
- [ ] Can connect via SSH: `ssh root@YOUR_IP`

### Server Initial Setup
- [ ] Updated system: `apt update && apt upgrade -y`
- [ ] Installed Node.js 18
- [ ] Installed PM2: `npm install -g pm2`
- [ ] Installed Nginx: `apt install nginx -y`
- [ ] Installed Certbot: `apt install certbot python3-certbot-nginx -y`
- [ ] Installed Git: `apt install git -y`
- [ ] Configured firewall (UFW)

### Firewall Configuration
```bash
- [ ] ufw allow ssh
- [ ] ufw allow http
- [ ] ufw allow https
- [ ] ufw enable
- [ ] ufw status (verified)
```

---

## PHASE 4: DEPLOY BACKEND

### Upload Code
- [ ] Method chosen: 
  - [ ] Git clone (recommended)
  - [ ] SCP upload
- [ ] Code uploaded to: /root/thrift-shop/backend

### Backend Configuration
- [ ] Navigated to backend directory
- [ ] Ran `npm install --production`
- [ ] Created production .env file
- [ ] Updated JWT_SECRET to secure random string
- [ ] Updated DATABASE_PATH
- [ ] Configured OpenAI API key (if needed)

### Start Backend
- [ ] Started with PM2: `pm2 start server.js --name backend`
- [ ] Verified running: `pm2 status`
- [ ] Saved PM2 config: `pm2 save`
- [ ] Setup auto-start: `pm2 startup`
- [ ] Backend accessible on port 5001

### Test Backend
- [ ] Tested locally: `curl http://localhost:5001/api/health`
- [ ] Response shows: `{"status":"OK"}`
- [ ] No errors in logs: `pm2 logs backend`

---

## PHASE 5: DEPLOY ADMIN PANEL

### Upload Code
- [ ] Admin panel code uploaded to: /root/thrift-shop/admin-panel

### Admin Configuration
- [ ] Navigated to admin-panel directory
- [ ] Ran `npm install`
- [ ] Built production version: `npm run build`
- [ ] Verified dist/ folder created

### Start Admin Panel
- [ ] Started with PM2: `pm2 start server.js --name admin`
- [ ] Verified running: `pm2 status`
- [ ] Saved PM2 config: `pm2 save`
- [ ] Admin accessible on port 8080

### Test Admin Panel
- [ ] Tested locally: `curl http://localhost:8080`
- [ ] No errors in logs: `pm2 logs admin`

---

## PHASE 6: CONFIGURE NGINX

### Create Nginx Configuration
- [ ] Created config file: `/etc/nginx/sites-available/thrift-shop`
- [ ] Configured backend proxy (api.domain.me → localhost:5001)
- [ ] Configured admin proxy (admin.domain.me → localhost:8080)
- [ ] Enabled site: `ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/`
- [ ] Removed default site: `rm /etc/nginx/sites-enabled/default`

### Test Nginx
- [ ] Tested config: `nginx -t`
- [ ] Restarted Nginx: `systemctl restart nginx`
- [ ] Verified status: `systemctl status nginx`

---

## PHASE 7: CONFIGURE DNS

### Namecheap DNS Settings
- [ ] Logged into Namecheap
- [ ] Went to domain → Advanced DNS
- [ ] Added A record: @ → YOUR_DIGITALOCEAN_IP
- [ ] Added A record: api → YOUR_DIGITALOCEAN_IP
- [ ] Added A record: admin → YOUR_DIGITALOCEAN_IP
- [ ] Added CNAME: www → @
- [ ] TTL set to Automatic

### Verify DNS
- [ ] Waited 5-10 minutes for propagation
- [ ] Tested: `dig api.yourdomain.me`
- [ ] Tested: `dig admin.yourdomain.me`
- [ ] Both resolve to correct IP

---

## PHASE 8: SETUP SSL CERTIFICATES

### Install SSL for Backend
- [ ] Ran: `certbot --nginx -d api.yourdomain.me`
- [ ] Entered email address
- [ ] Agreed to terms
- [ ] Certificate installed successfully
- [ ] Tested: `https://api.yourdomain.me/api/health`

### Install SSL for Admin
- [ ] Ran: `certbot --nginx -d admin.yourdomain.me`
- [ ] Certificate installed successfully
- [ ] Tested: `https://admin.yourdomain.me`

### Verify Auto-Renewal
- [ ] Tested renewal: `certbot renew --dry-run`
- [ ] Auto-renewal configured

---

## PHASE 9: DEPLOY TO VERCEL

### Install Vercel CLI
- [ ] Installed: `npm install -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Verified account connected

### Update Environment Variables
- [ ] Updated all .env.company* files
- [ ] Changed API URL to: `https://api.yourdomain.me/api`
- [ ] Verified company IDs are correct
- [ ] Verified currency settings

### Deploy Company 1
- [ ] Copied: `cp .env.company1 .env.local`
- [ ] Deployed: `vercel --prod`
- [ ] Deployment URL: _______________
- [ ] Tested deployment works

### Deploy Company 2
- [ ] Copied: `cp .env.company2 .env.local`
- [ ] Deployed: `vercel --prod`
- [ ] Deployment URL: _______________
- [ ] Tested deployment works

### Deploy Additional Companies
- [ ] Company 3 deployed: _______________
- [ ] Company 4 deployed: _______________
- [ ] Company 5 deployed: _______________

### Configure Custom Domains
- [ ] Added custom domain in Vercel: vintage.yourdomain.me
- [ ] Added CNAME in Namecheap: vintage → cname.vercel-dns.com
- [ ] Verified SSL auto-configured
- [ ] Repeated for all companies

---

## PHASE 10: FINAL TESTING

### Backend API Testing
- [ ] Health check: `https://api.yourdomain.me/api/health`
- [ ] CORS test: `https://api.yourdomain.me/api/cors-test`
- [ ] Can register user
- [ ] Can login user
- [ ] Can fetch products
- [ ] Can create order

### Admin Panel Testing
- [ ] Can access: `https://admin.yourdomain.me`
- [ ] Can login with admin credentials
- [ ] Can view dashboard
- [ ] Can manage companies
- [ ] Can manage products
- [ ] Can view orders
- [ ] Can manage users

### Company Website Testing (for each company)
- [ ] Homepage loads correctly
- [ ] Products page shows items
- [ ] Can view product details
- [ ] Can add to cart
- [ ] Can register new user
- [ ] Can login
- [ ] Can place order
- [ ] Can view order history
- [ ] Theme/branding correct

### Security Testing
- [ ] All sites use HTTPS
- [ ] SSL certificates valid
- [ ] No mixed content warnings
- [ ] CORS working correctly
- [ ] JWT authentication working
- [ ] Admin routes protected

### Performance Testing
- [ ] Page load times acceptable
- [ ] Images loading correctly
- [ ] API responses fast
- [ ] No console errors
- [ ] Mobile responsive

---

## PHASE 11: MONITORING & MAINTENANCE

### Setup Monitoring
- [ ] Bookmarked DigitalOcean dashboard
- [ ] Bookmarked Vercel dashboard
- [ ] Setup email alerts in DigitalOcean
- [ ] Documented admin credentials securely

### Backup Strategy
- [ ] Database backup location: _______________
- [ ] Backup frequency: _______________
- [ ] Tested backup restoration

### Documentation
- [ ] Documented server IP and credentials
- [ ] Documented domain registrar info
- [ ] Documented deployment process
- [ ] Created runbook for common tasks

---

## PHASE 12: GO LIVE!

### Pre-Launch
- [ ] All tests passing
- [ ] SSL certificates active
- [ ] DNS fully propagated
- [ ] Admin panel accessible
- [ ] All company sites working
- [ ] Backup created

### Launch
- [ ] Announced to users
- [ ] Shared company URLs
- [ ] Monitoring active
- [ ] Support plan ready

### Post-Launch
- [ ] Monitored for 24 hours
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Users can register and order

---

## 📊 DEPLOYMENT SUMMARY

### URLs
- Backend API: https://api._______________.me
- Admin Panel: https://admin._______________.me
- Company 1: https://vintage._______________.me
- Company 2: https://eco._______________.me
- Company 3: https://retro._______________.me
- Company 4: https://urban._______________.me
- Company 5: https://sustainable._______________.me

### Credentials
- DigitalOcean: _______________
- Namecheap: _______________
- Vercel: _______________
- Admin Panel: _______________

### Costs
- Month 1-12: $0 (covered by student credits)
- Month 13+: ~$7/month

### Support
- DigitalOcean Support: https://www.digitalocean.com/support
- Vercel Support: https://vercel.com/support
- GitHub Student Pack: https://education.github.com/pack

---

## 🎉 CONGRATULATIONS!

Your multi-company thrift shop is now live and running!

### What You've Accomplished:
✅ Professional backend API with SSL
✅ Secure admin panel
✅ Multiple company storefronts
✅ Global CDN delivery
✅ Automatic SSL certificates
✅ All for FREE (first year)!

### Next Steps:
1. Create your first company in admin panel
2. Add products to your stores
3. Test the complete user journey
4. Share your store URLs with customers
5. Monitor performance and usage

**You're now running a professional e-commerce platform! 🚀**

---

## 🆘 TROUBLESHOOTING CHECKLIST

If something isn't working:

### Backend Issues
- [ ] Check PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs backend`
- [ ] Restart: `pm2 restart backend`
- [ ] Check .env file exists and is correct
- [ ] Verify database file exists

### Admin Panel Issues
- [ ] Check PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs admin`
- [ ] Restart: `pm2 restart admin`
- [ ] Verify build completed: `ls dist/`

### Nginx Issues
- [ ] Check status: `systemctl status nginx`
- [ ] Check config: `nginx -t`
- [ ] Check logs: `tail -f /var/log/nginx/error.log`
- [ ] Restart: `systemctl restart nginx`

### DNS Issues
- [ ] Wait 24-48 hours for full propagation
- [ ] Check DNS: `dig yourdomain.me`
- [ ] Verify A records in Namecheap
- [ ] Clear browser cache

### SSL Issues
- [ ] Check certificates: `certbot certificates`
- [ ] Renew: `certbot renew`
- [ ] Check Nginx config includes SSL

### Vercel Issues
- [ ] Check deployment logs in dashboard
- [ ] Verify environment variables
- [ ] Redeploy: `vercel --prod`
- [ ] Check custom domain configuration

---

**Keep this checklist for future reference and updates!**
