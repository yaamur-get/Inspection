# Deployment Guide - Yaamur Mosque Inspection System

## 🚀 **Deployment Checklist**

### **1. Pre-Deployment Requirements**

#### **Supabase Configuration**
- [x] Supabase project is created and connected
- [x] Database tables are created with proper relationships
- [x] Row Level Security (RLS) policies are enabled
- [x] Storage bucket for photos is configured
- [x] Authentication is set up

#### **Environment Variables**
Ensure `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **Font File (Critical for PDF)**
- [ ] Download **Tajawal-Regular.ttf** from Google Fonts
- [ ] Place it in `/public/fonts/Tajawal-Regular.ttf`
- [ ] Verify the file exists before deployment

---

### **2. Vercel Deployment Steps**

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "feat: Complete Yaamur mosque inspection system"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Apply to: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

---

### **3. Post-Deployment Verification**

#### **Test Core Features**
- [ ] Login/Authentication works
- [ ] Dashboard loads with correct data
- [ ] Can create new mosque entries
- [ ] Can create new inspection reports
- [ ] Photos upload successfully
- [ ] PDF generation works with Arabic text
- [ ] RTL layout displays correctly
- [ ] Mobile view is responsive

#### **Check Supabase Connection**
- [ ] API requests succeed (check Network tab)
- [ ] Data saves to database
- [ ] Photos store in Supabase Storage
- [ ] RLS policies allow proper access

#### **Performance Checks**
- [ ] Page load time < 3 seconds
- [ ] Images are optimized
- [ ] No console errors
- [ ] PDF generation completes quickly

---

### **4. Domain Configuration (Optional)**

If you want a custom domain:

1. **Purchase Domain** (e.g., from Namecheap, GoDaddy)

2. **Add to Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Update Supabase Redirect URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your custom domain to allowed redirect URLs

---

### **5. Ongoing Maintenance**

#### **Regular Updates**
- Monitor Supabase usage and storage limits
- Update dependencies monthly: `npm update`
- Review and optimize database queries
- Backup database regularly from Supabase dashboard

#### **Monitoring**
- Check Vercel Analytics for traffic and performance
- Monitor Supabase logs for errors
- Review user feedback and bug reports

#### **Security**
- Rotate Supabase keys if compromised
- Review RLS policies regularly
- Keep Next.js and dependencies updated
- Enable 2FA on Vercel and Supabase accounts

---

### **6. Troubleshooting Common Issues**

#### **PDF Arabic Text Not Displaying**
- **Cause:** Tajawal font file missing
- **Solution:** Ensure `/public/fonts/Tajawal-Regular.ttf` exists

#### **Photos Not Uploading**
- **Cause:** Storage bucket not configured
- **Solution:** Check Supabase Storage settings and RLS policies

#### **Database Connection Errors**
- **Cause:** Environment variables not set
- **Solution:** Verify `.env.local` or Vercel environment variables

#### **RTL Layout Issues**
- **Cause:** Browser cache or CSS not loading
- **Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

---

### **7. Scaling Considerations**

As your application grows:

- **Supabase:** Upgrade to Pro plan for higher limits
- **Vercel:** Monitor bandwidth and serverless function usage
- **Database:** Add indexes to frequently queried columns
- **Storage:** Implement image compression before upload
- **Caching:** Add Redis for frequently accessed data

---

## 📞 **Support Resources**

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## ✅ **Deployment Complete!**

Your Yaamur Mosque Inspection System is now live and ready for use by your field technicians!
