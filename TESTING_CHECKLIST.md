# Testing Checklist for Yaamur Mosque Inspection System

## ✅ **1. RTL (Right-to-Left) Layout**
- [ ] All pages display in RTL mode
- [ ] Arabic text aligns correctly to the right
- [ ] Navigation buttons and icons are flipped appropriately
- [ ] Form inputs and labels are right-aligned
- [ ] Tables and cards display in RTL order

## ✅ **2. Supabase Database Integration**
- [ ] User authentication works (login/logout)
- [ ] Mosques can be created, read, updated, and deleted
- [ ] Reports can be created and linked to mosques
- [ ] Issues can be added to reports with photos
- [ ] Photos upload successfully to Supabase Storage
- [ ] All relationships between tables work correctly

## ✅ **3. Dashboard Functionality**
- [ ] Dashboard loads without sidebar
- [ ] Statistics display correctly (Total Mosques, Reports, Pending)
- [ ] "Add New Report" button is prominent and works
- [ ] Search bar filters reports by mosque name
- [ ] Report list displays newest first
- [ ] Each report card shows: mosque name, district, date, photo
- [ ] Report actions work: View, Edit, Generate PDF, Delete

## ✅ **4. Mobile Responsiveness**
- [ ] Dashboard is fully responsive on mobile (320px+)
- [ ] All buttons are at least 44px for easy tapping
- [ ] Forms are easy to fill on mobile devices
- [ ] No horizontal scrolling on any page
- [ ] Images scale properly on small screens
- [ ] Navigation is thumb-friendly

## ✅ **5. New Report Creation**
- [ ] Form has all required fields (mosque name, supervisor, phone, etc.)
- [ ] Phone number validates Saudi format (05xxxxxxxx)
- [ ] "Auto-Fill Location" button works and populates fields
- [ ] Main mosque photo can be uploaded
- [ ] Google Maps link field accepts URLs
- [ ] Issues can be added with main/sub items
- [ ] Issue photos upload correctly (1 or 3 depending on case)
- [ ] Quantities and prices calculate correctly

## ✅ **6. PDF Generation**
- [ ] "Generate PDF" button creates a downloadable file
- [ ] **Cover Page:** Shows logo, title, mosque name, district, city, main photo, date, footer
- [ ] **Page 2:** Shows mosque details, supervisor info, Google Maps screenshot, contact footer
- [ ] **Issue Pages:** Display photos (1 or 3) with item details below
- [ ] **Cost Table:** Shows all items, quantities, unit prices, totals, operational expenses
- [ ] PDF is in A4 format and print-ready
- [ ] Arabic text displays correctly (requires Tajawal font)

## ✅ **7. Admin Panel**
- [ ] User management page works
- [ ] Users can be added, activated, deactivated, deleted
- [ ] Item management page works
- [ ] Main items can be created and deleted
- [ ] Sub items can be added under main items with units and prices
- [ ] All changes save to Supabase

## ✅ **8. Auto-Fill Location Feature**
- [ ] Button appears in the report form
- [ ] Clicking button requests geolocation permission
- [ ] If allowed: fills city, district, Google Maps link
- [ ] If denied: shows clear message and allows manual entry
- [ ] Geolocation data is accurate

## 🔧 **9. Font Setup (Manual Step Required)**
- [ ] Download Tajawal-Regular.ttf from Google Fonts
- [ ] Place it in `/public/fonts/Tajawal-Regular.ttf`
- [ ] Verify PDF Arabic text renders correctly

## 📝 **Additional Checks**
- [ ] All console errors are resolved
- [ ] No broken images or missing resources
- [ ] Loading states display appropriately
- [ ] Error messages are clear and in Arabic
- [ ] Success messages appear after actions
- [ ] Data persists after page refresh

---

## 🎯 **Final Verification Steps**

1. **Create a test mosque** with full details and photo
2. **Create a test report** with at least 3 issues and multiple photos
3. **Generate the PDF** and verify all pages display correctly
4. **Test on mobile device** (or Chrome DevTools mobile view)
5. **Test RTL layout** by checking all Arabic text alignment
6. **Verify database** by checking Supabase dashboard for stored data

---

## 📞 **Support**
If any issues arise during testing, check:
- Browser console for JavaScript errors
- Network tab for failed API requests
- Supabase dashboard for database connection issues
- `/public/fonts/` directory for the Tajawal font file
