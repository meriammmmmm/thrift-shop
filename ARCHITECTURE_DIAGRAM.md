# 🏗️ Multi-Company Thrift Shop Architecture

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET USERS                          │
│                    (Customers & Admins)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NAMECHEAP DNS (FREE)                         │
│                    yourdomain.me                                │
│                                                                 │
│  Routes:                                                        │
│  • api.yourdomain.me      → DigitalOcean                       │
│  • admin.yourdomain.me    → DigitalOcean                       │
│  • vintage.yourdomain.me  → Vercel                             │
│  • eco.yourdomain.me      → Vercel                             │
│  • retro.yourdomain.me    → Vercel                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│   DIGITALOCEAN VPS        │  │      VERCEL CDN              │
│   ($200 credit - FREE)    │  │      (FREE forever)          │
│                           │  │                              │
│  ┌─────────────────────┐  │  │  ┌────────────────────────┐ │
│  │   NGINX (Port 80)   │  │  │  │  Company 1 Website     │ │
│  │   Reverse Proxy     │  │  │  │  (Next.js)             │ │
│  │   + SSL (Let's      │  │  │  │  vintage.yourdomain.me │ │
│  │     Encrypt)        │  │  │  └────────────────────────┘ │
│  └──────────┬──────────┘  │  │                              │
│             │              │  │  ┌────────────────────────┐ │
│    ┌────────┴────────┐     │  │  │  Company 2 Website     │ │
│    │                 │     │  │  │  (Next.js)             │ │
│    ▼                 ▼     │  │  │  eco.yourdomain.me     │ │
│  ┌──────────┐  ┌─────────┐│  │  └────────────────────────┘ │
│  │ Backend  │  │  Admin  ││  │                              │
│  │   API    │  │  Panel  ││  │  ┌────────────────────────┐ │
│  │ (Node.js)│  │ (React) ││  │  │  Company 3 Website     │ │
│  │ Port 5001│  │Port 8080││  │  │  (Next.js)             │ │
│  └────┬─────┘  └─────────┘│  │  │  retro.yourdomain.me   │ │
│       │                    │  │  └────────────────────────┘ │
│       ▼                    │  │                              │
│  ┌──────────┐              │  │  ... unlimited stores!       │
│  │ SQLite   │              │  │                              │
│  │ Database │              │  └──────────────────────────────┘
│  └──────────┘              │
│                            │
│  Managed by PM2            │
│  Auto-restart on crash     │
└────────────────────────────┘
```

---

## 🔄 Request Flow

### Customer Browsing a Store

```
Customer Browser
      │
      │ 1. Visit vintage.yourdomain.me
      ▼
   Vercel CDN (Global)
      │
      │ 2. Serve Next.js app (cached)
      ▼
Customer sees website
      │
      │ 3. Click "View Products"
      ▼
   API Request
      │
      │ 4. GET https://api.yourdomain.me/api/products?companyId=1
      ▼
DigitalOcean VPS
      │
      │ 5. Nginx receives request
      ▼
   Backend API (Node.js)
      │
      │ 6. Query SQLite database
      ▼
   SQLite Database
      │
      │ 7. Return products for Company 1
      ▼
   Backend API
      │
      │ 8. Send JSON response
      ▼
   Vercel CDN
      │
      │ 9. Display products
      ▼
Customer sees products
```

---

## 🔐 Admin Managing Products

```
Admin Browser
      │
      │ 1. Visit admin.yourdomain.me
      ▼
DigitalOcean VPS
      │
      │ 2. Nginx routes to port 8080
      ▼
   Admin Panel (React)
      │
      │ 3. Login with credentials
      ▼
   API Request
      │
      │ 4. POST https://api.yourdomain.me/api/auth/login
      ▼
   Backend API
      │
      │ 5. Verify credentials
      │ 6. Generate JWT token
      ▼
   Admin Panel
      │
      │ 7. Store JWT token
      │ 8. Navigate to Products
      ▼
   API Request
      │
      │ 9. POST https://api.yourdomain.me/api/products
      │    Headers: Authorization: Bearer <JWT>
      ▼
   Backend API
      │
      │ 10. Verify JWT
      │ 11. Check admin permissions
      │ 12. Insert product into database
      ▼
   SQLite Database
      │
      │ 13. Product saved
      ▼
   Backend API
      │
      │ 14. Return success
      ▼
   Admin Panel
      │
      │ 15. Show success message
      ▼
Admin sees confirmation
```

---

## 🏢 Multi-Company Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED BACKEND API                       │
│                  (Single DigitalOcean VPS)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQLite Database                         │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Companies Table                                │ │  │
│  │  │  • id: 1, name: "Vintage Treasures"           │ │  │
│  │  │  • id: 2, name: "Eco Fashion Hub"             │ │  │
│  │  │  • id: 3, name: "Retro Style Co"              │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Products Table                                 │ │  │
│  │  │  • id: 1, name: "Vintage Dress", companyId: 1 │ │  │
│  │  │  • id: 2, name: "Eco Bag", companyId: 2       │ │  │
│  │  │  • id: 3, name: "Retro Shoes", companyId: 3   │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Users Table                                    │ │  │
│  │  │  • id: 1, email: "user@co1.com", companyId: 1 │ │  │
│  │  │  • id: 2, email: "user@co2.com", companyId: 2 │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ Orders Table                                   │ │  │
│  │  │  • id: 1, userId: 1, companyId: 1             │ │  │
│  │  │  • id: 2, userId: 2, companyId: 2             │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ API Queries filter by companyId
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Company 1    │    │  Company 2    │    │  Company 3    │
│   Website     │    │   Website     │    │   Website     │
│  (Vercel)     │    │  (Vercel)     │    │  (Vercel)     │
│               │    │               │    │               │
│ COMPANY_ID=1  │    │ COMPANY_ID=2  │    │ COMPANY_ID=3  │
│               │    │               │    │               │
│ Only sees:    │    │ Only sees:    │    │ Only sees:    │
│ • Products    │    │ • Products    │    │ • Products    │
│   for Co. 1   │    │   for Co. 2   │    │   for Co. 3   │
│ • Users       │    │ • Users       │    │ • Users       │
│   for Co. 1   │    │   for Co. 2   │    │   for Co. 3   │
│ • Orders      │    │ • Orders      │    │ • Orders      │
│   for Co. 1   │    │   for Co. 2   │    │   for Co. 3   │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 💾 Data Flow

### Product Creation Flow

```
Admin Panel
    │
    │ 1. Admin fills product form
    │    • Name: "Vintage Dress"
    │    • Price: $50
    │    • Company: Vintage Treasures (ID: 1)
    ▼
POST /api/products
    │
    │ 2. Request with JWT token
    │    Headers: Authorization: Bearer <token>
    │    Body: { name, price, companyId: 1, ... }
    ▼
Backend Middleware
    │
    │ 3. Verify JWT token
    │ 4. Extract admin user info
    │ 5. Check admin permissions
    ▼
Backend Controller
    │
    │ 6. Validate product data
    │ 7. Check admin belongs to company
    ▼
Database Query
    │
    │ 8. INSERT INTO products
    │    (name, price, companyId, ...)
    │    VALUES (?, ?, ?, ...)
    ▼
SQLite Database
    │
    │ 9. Product saved with ID
    ▼
Backend Response
    │
    │ 10. Return { success: true, product: {...} }
    ▼
Admin Panel
    │
    │ 11. Show success message
    │ 12. Refresh product list
    ▼
Admin sees new product
```

### Customer Order Flow

```
Customer Website (Vercel)
    │
    │ 1. Customer adds items to cart
    │ 2. Proceeds to checkout
    ▼
POST /api/orders
    │
    │ 3. Request with user JWT
    │    Headers: Authorization: Bearer <token>
    │    Body: { items: [...], total, companyId: 1 }
    ▼
Backend API
    │
    │ 4. Verify user JWT
    │ 5. Verify user belongs to company
    │ 6. Validate cart items
    ▼
Database Transaction
    │
    │ 7. BEGIN TRANSACTION
    │ 8. INSERT INTO orders
    │ 9. INSERT INTO order_items (multiple)
    │ 10. UPDATE products (reduce stock)
    │ 11. COMMIT TRANSACTION
    ▼
Backend Response
    │
    │ 12. Return { orderId, status: "pending" }
    ▼
Customer Website
    │
    │ 13. Redirect to order confirmation
    │ 14. Show order details
    ▼
Customer sees order confirmation
```

---

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌─────────────────────────────────────────────────────────────┐
│  • UFW Firewall (only ports 22, 80, 443 open)              │
│  • SSH key authentication (no password login)               │
│  • Fail2ban (optional - blocks brute force)                 │
└─────────────────────────────────────────────────────────────┘

Layer 2: Transport Security
┌─────────────────────────────────────────────────────────────┐
│  • SSL/TLS certificates (Let's Encrypt)                     │
│  • HTTPS only (HTTP redirects to HTTPS)                     │
│  • Secure headers (Helmet.js)                               │
└─────────────────────────────────────────────────────────────┘

Layer 3: Application Security
┌─────────────────────────────────────────────────────────────┐
│  • JWT authentication (signed tokens)                       │
│  • Password hashing (bcrypt)                                │
│  • CORS configuration (allowed origins)                     │
│  • Rate limiting (prevent abuse)                            │
└─────────────────────────────────────────────────────────────┘

Layer 4: Data Security
┌─────────────────────────────────────────────────────────────┐
│  • Company isolation (companyId filtering)                  │
│  • User isolation (userId filtering)                        │
│  • Admin role checks (permission validation)                │
│  • SQL injection prevention (parameterized queries)         │
└─────────────────────────────────────────────────────────────┘

Layer 5: Monitoring & Backup
┌─────────────────────────────────────────────────────────────┐
│  • PM2 process monitoring                                   │
│  • Nginx access logs                                        │
│  • Database backups (scheduled)                             │
│  • Error logging (application logs)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Scaling Strategy

### Current Setup (Free Tier)
```
DigitalOcean: 1GB RAM, 1 vCPU
Handles: ~100-500 concurrent users
Cost: $0/month (with student credit)
```

### Small Business (Month 13+)
```
DigitalOcean: 2GB RAM, 1 vCPU ($12/month)
Handles: ~500-1000 concurrent users
Cost: ~$13/month
```

### Growing Business
```
DigitalOcean: 4GB RAM, 2 vCPU ($24/month)
+ Managed Database ($15/month)
Handles: ~1000-5000 concurrent users
Cost: ~$40/month
```

### Enterprise
```
DigitalOcean: Load Balanced ($50+/month)
+ Managed PostgreSQL ($50+/month)
+ CDN ($10+/month)
Handles: 10,000+ concurrent users
Cost: ~$110+/month
```

---

## 🚀 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                        │
│  • Code changes                                             │
│  • Local testing                                            │
│  • Git commit                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ git push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                        │
│  • Code stored                                              │
│  • Version control                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌───────────────────────┐  ┌──────────────────────────────┐
│  DIGITALOCEAN VPS     │  │      VERCEL                  │
│                       │  │                              │
│  Manual Deployment:   │  │  Automatic Deployment:       │
│  1. SSH to server     │  │  1. Detects git push         │
│  2. git pull          │  │  2. Builds automatically     │
│  3. npm install       │  │  3. Deploys to CDN           │
│  4. npm run build     │  │  4. Updates live site        │
│  5. pm2 restart       │  │                              │
└───────────────────────┘  └──────────────────────────────┘
```

---

## 💡 Key Benefits of This Architecture

### Cost Efficiency
- ✅ First year completely FREE with student pack
- ✅ Only $7-8/month after credits expire
- ✅ Scales affordably as you grow

### Performance
- ✅ Global CDN (Vercel) for fast page loads
- ✅ Optimized Next.js builds
- ✅ Efficient SQLite database
- ✅ Nginx caching

### Reliability
- ✅ PM2 auto-restarts crashed processes
- ✅ Vercel 99.99% uptime SLA
- ✅ Automatic SSL renewal
- ✅ Database backups

### Scalability
- ✅ Add unlimited companies (just deploy to Vercel)
- ✅ Upgrade server as needed
- ✅ Easy to migrate to managed database
- ✅ Can add load balancer later

### Security
- ✅ HTTPS everywhere
- ✅ JWT authentication
- ✅ Company isolation
- ✅ Firewall protection

### Developer Experience
- ✅ Simple deployment process
- ✅ Easy to update and maintain
- ✅ Good monitoring tools
- ✅ Clear separation of concerns

---

## 🎓 Learning Resources

### DigitalOcean
- Tutorials: https://www.digitalocean.com/community/tutorials
- Documentation: https://docs.digitalocean.com

### Vercel
- Documentation: https://vercel.com/docs
- Deployment Guide: https://vercel.com/docs/deployments/overview

### Nginx
- Beginner's Guide: http://nginx.org/en/docs/beginners_guide.html
- Configuration: https://nginx.org/en/docs/

### PM2
- Quick Start: https://pm2.keymetrics.io/docs/usage/quick-start/
- Process Management: https://pm2.keymetrics.io/docs/usage/process-management/

### Let's Encrypt
- Getting Started: https://letsencrypt.org/getting-started/
- Certbot: https://certbot.eff.org/

---

**This architecture gives you a professional, scalable, and cost-effective multi-company e-commerce platform! 🚀**
