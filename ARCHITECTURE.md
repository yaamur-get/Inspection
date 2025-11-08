# 🏗️ Project Architecture Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [User Flows](#user-flows)
5. [Key Files Explained](#key-files-explained)
6. [How to Modify Features](#how-to-modify-features)
7. [Common Tasks](#common-tasks)

---

## 🎯 Project Overview

This is a **mosque inspection management system** built with Next.js. It allows:
- **Admin users** to manage staff and configure inspection items
- **Technician users** to create field inspection reports with photos
- **PDF generation** of professional inspection reports with Yaamur branding

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Yaamur theme
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **PDF Generation**: html2canvas
- **State Management**: React Context (AuthContext)
- **Data Storage**:  superbase

---

## 📁 Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components (pre-built)
│   ├── Layout.tsx      # Main app layout with sidebar/header
│   └── ThemeSwitch.tsx # Dark/light mode toggle
│
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # User authentication state
│   └── ThemeProvider.tsx # Theme management
│
├── pages/              # Next.js pages (routes)
│   ├── index.tsx       # Login page (/)
│   ├── dashboard.tsx   # Main dashboard (/dashboard)
│   ├── admin/          # Admin-only pages
│   │   ├── users.tsx   # User management (/admin/users)
│   │   └── items.tsx   # Item management (/admin/items)
│   ├── field/          # Technician pages
│   │   ├── index.tsx   # Reports list (/field)
│   │   ├── new-report.tsx  # Create report (/field/new-report)
│   │   └── report/
│   │       └── [id].tsx    # Edit report (/field/report/123)
│   ├── _app.tsx        # App wrapper (providers, layout)
│   └── _document.tsx   # HTML document structure
│
├── lib/                # Utility functions
│   ├── pdfGenerator.ts # PDF report generation logic
│   └── utils.ts        # Helper functions (cn, etc.)
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All app types (User, Mosque, Issue, etc.)
│
└── styles/             # Global styles
    └── globals.css     # Tailwind config + custom Yaamur theme
```

---

## 👥 User Flows

### Admin Flow
1. **Login** (`/`) with admin credentials
2. **Dashboard** (`/dashboard`) - View stats, quick actions
3. **Manage Users** (`/admin/users`) - Add/edit/delete staff
4. **Manage Items** (`/admin/items`) - Configure inspection items and pricing

### Technician Flow
1. **Login** (`/`) with technician credentials
2. **Dashboard** (`/dashboard`) - View stats, quick actions
3. **View Reports** (`/field`) - Browse all inspection reports
4. **Create Report** (`/field/new-report`):
   - Step 1: Enter mosque information
   - Step 2: Add issues (Case 1: single item + 3 photos, Case 2: 3 items + 3 photos)
   - Generate PDF report
5. **Edit Report** (`/field/report/[id]`) - Modify existing report
6. **Download PDF** - Generate professional PDF report

---

## 🔑 Key Files Explained

### Entry Points

#### `src/pages/_app.tsx` (Root Application)
- Wraps entire app with providers (Theme, Auth, Layout)
- All pages inherit these features automatically
- **When to edit**: Adding global providers, analytics, or app-wide state

#### `src/pages/index.tsx` (Login Page)
- First page users see
- Mock authentication with demo accounts
- Stores user in localStorage
- **When to edit**: Changing login UI, adding real authentication

#### `src/pages/dashboard.tsx` (Main Dashboard)
- Shows different content for Admin vs Technician
- Quick action buttons, stats cards, recent activity
- **When to edit**: Changing dashboard layout, adding new stats

---

### Core Contexts

#### `src/contexts/AuthContext.tsx` (Authentication)
```typescript
// Provides:
const { user, login, logout, isLoading } = useAuth();
```
- Manages user login state
- Stores user in localStorage
- **When to edit**: Adding real backend auth, user permissions

---

### Admin Pages

#### `src/pages/admin/users.tsx` (User Management)
- **Lines to focus on**:
  - `Line 12-21`: User form state
  - `Line 66-84`: Form submission logic
  - `Line 190-230`: User list rendering
- **When to edit**: Changing user fields, adding roles

#### `src/pages/admin/items.tsx` (Item Management)
- **Structure**: Collapsible main items with nested sub-items
- **Lines to focus on**:
  - `Line 85-110`: Main item CRUD
  - `Line 112-138`: Sub-item CRUD
  - `Line 290-370`: Collapsible item UI
- **When to edit**: Adding item properties, changing pricing structure

---

### Technician Pages

#### `src/pages/field/index.tsx` (Reports List)
- Displays all mosque reports as cards
- Actions: Edit, Download PDF, Delete
- **Lines to focus on**:
  - `Line 58`: `handleGeneratePDF` - PDF generation trigger
  - `Line 100-150`: Mock report data
  - `Line 180-250`: Report card rendering
- **When to edit**: Changing report list layout, filtering

#### `src/pages/field/new-report.tsx` (Create Report) - **LARGE FILE**
- **Step 1 (Lines 95-290)**: Mosque information form
- **Step 2 (Lines 292-550)**: Add issues with photos
- **Two Cases**:
  - **Case 1**: 1 sub-item + 3 photos
  - **Case 2**: 3 sub-items + 3 photos (1 per item)
- **Lines to focus on**:
  - `Line 145-160`: Phone validation
  - `Line 220-280`: Issue submission logic
  - `Line 400-500`: Photo upload handling
- **When to edit**: Adding form fields, changing validation

---

### PDF Generation

#### `src/lib/pdfGenerator.ts` (PDF Generator)
- **Class**: `PDFGenerator`
- **Pages generated**:
  1. **Cover Page** (`generateCoverPage`): Logo, title, mosque photo
  2. **Info Page** (`generateMosqueInfoPage`): Google Maps, supervisor details
  3. **Issue Pages** (`generateIssuePage`): Photos + item details (one per issue)
  4. **Cost Summary** (`generateCostSummaryPage`): Table with total costs
- **Lines to focus on**:
  - `Line 10-16`: Yaamur branding constants
  - `Line 30-60`: Cover page layout
  - `Line 130-200`: Issue page rendering
  - `Line 210-280`: Cost table generation
- **When to edit**: Changing PDF layout, adding branding elements

---

### UI Components

#### `src/components/Layout.tsx` (App Shell)
- Header with logo, user info, logout
- Sidebar navigation (role-based)
- **When to edit**: Changing navigation items, header layout

#### `src/components/ui/*` (Shadcn Components)
- Pre-built, customizable UI components
- Examples: Button, Card, Dialog, Input, Select
- **When to edit**: Rarely - these are designed to be used as-is
- **How to customize**: Use Tailwind classes when using components

---

### Types

#### `src/types/index.ts` (TypeScript Definitions)
All app data structures:
```typescript
User          // Admin or technician users
Mosque        // Mosque information
MainItem      // Main inspection categories
SubItem       // Sub-items with pricing
Issue         // Problems found during inspection
IssueSubItem  // Sub-item instance in an issue
InspectionReport  // Complete report with all data
PDFReportData     // Data for PDF generation
```
- **When to edit**: Adding new fields to data structures

---

## 🎨 How to Modify Features

### Adding a New Field to Mosque Form

1. **Update type** in `src/types/index.ts`:
```typescript
export interface Mosque {
  // ... existing fields
  newField: string;  // Add your new field
}
```

2. **Update form state** in `src/pages/field/new-report.tsx`:
```typescript
const [mosqueForm, setMosqueForm] = useState({
  // ... existing fields
  newField: "",
});
```

3. **Add form input** in the same file:
```tsx
<Input
  value={mosqueForm.newField}
  onChange={(e) => setMosqueForm({ ...mosqueForm, newField: e.target.value })}
  placeholder="New field"
/>
```

4. **Update PDF generator** in `src/lib/pdfGenerator.ts` to display the new field

---

### Changing Yaamur Brand Colors

Edit `src/styles/globals.css`:
```css
:root {
  --brand-primary: #04734F;    /* Change main green */
  --brand-secondary: #E6C5B8;  /* Change secondary beige */
}
```

Colors are automatically applied via Tailwind classes like:
- `text-yaamur-primary`
- `bg-yaamur-secondary`
- `yaamur-gradient` (for gradient backgrounds)

---

### Adding a New Page

1. **Create page file**: `src/pages/my-page.tsx`
```tsx
export default function MyPage() {
  return <div>My New Page</div>;
}
```

2. **Add navigation** in `src/components/Layout.tsx`:
```typescript
const navigation = [
  // ... existing items
  {
    name: "My Page",
    href: "/my-page",
    icon: MyIcon,
    show: true,  // or based on role
  },
];
```

3. **Auto-routing**: Next.js automatically creates route at `/my-page`

---

## 🔧 Common Tasks

### Task: Change Login Credentials

**File**: `src/contexts/AuthContext.tsx`
**Lines**: 18-33
```typescript
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@mosque.sa",  // Change email
    fullName: "Your Name",      // Change name
    // ... other fields
  },
];
```

---

### Task: Add New Main Item Category

**File**: `src/pages/admin/items.tsx`
**Action**: Use the "Add Main Item" button in the admin UI
**Or manually**: Update `mockMainItems` array (Line 55-70)

---

### Task: Customize PDF Layout

**File**: `src/lib/pdfGenerator.ts`
**Focus on these methods**:
- `generateCoverPage`: Title page design
- `generateIssuePage`: Issue photos and details
- `generateCostSummaryPage`: Cost table layout

Each method uses `jsPDF` API to draw text, shapes, and images.

---

### Task: Change Phone Validation

**File**: `src/pages/field/new-report.tsx`
**Line**: 147-150
```typescript
const validatePhoneNumber = (phone: string) => {
  const saudiPhoneRegex = /^(\+966|966|0)5[0-9]{8}$/;  // Modify regex
  return saudiPhoneRegex.test(phone.replace(/\s/g, ""));
};
```

---

### Task: Make Reports Persist (Add Backend)

Currently using localStorage mock data. To add real backend:

1. **Choose backend**: Supabase (recommended), Firebase, or custom API
2. **Replace mock data** in:
   - `src/pages/field/index.tsx` (Line 29-90)
   - `src/pages/field/new-report.tsx` (Line 48-75)
   - `src/pages/admin/*` pages
3. **Add API calls** instead of `setReports([...reports, newReport])`
4. **Update AuthContext** for real authentication

---

## 📝 Learning Path

### Beginner Path
1. Start with `src/pages/index.tsx` - Understand login flow
2. Follow user journey through dashboard → reports → create report
3. Read `src/types/index.ts` to understand data structures
4. Explore one admin page (users or items)

### Intermediate Path
1. Understand `src/contexts/AuthContext.tsx` for state management
2. Study `src/components/Layout.tsx` for app structure
3. Dive into `src/pages/field/new-report.tsx` - complex form logic
4. Examine `src/lib/pdfGenerator.ts` - PDF generation

### Advanced Path
1. Refactor large files (new-report.tsx, items.tsx, report/[id].tsx)
2. Add real backend integration
3. Implement advanced PDF features (images, custom fonts)
4. Add testing and error boundaries

---

## 🐛 Debugging Tips

### Preview Not Loading?
1. Check browser console for errors (F12)
2. Click "Refresh Preview" button (top-left of preview pane)
3. Restart server: Settings → "Restart Server"
4. Check for runtime errors in Bug Finder

### TypeScript Errors?
- Run: `npx tsc --noEmit` to see all type errors
- Most common: Missing properties, wrong types

### CSS Not Applying?
- Check `@import` statements are at the top of CSS files
- Verify Tailwind class names are correct
- Check if custom classes are defined in `globals.css`

---

## 🚀 Next Steps

1. **Connect to Supabase**: Replace mock data with real database
2. **Add Image Upload**: Store actual mosque photos
3. **Implement Search/Filter**: In reports list page
4. **Add Pagination**: For long report lists
5. **Improve PDF**: Add real images, custom fonts, QR codes
6. **Add Tests**: Unit tests for logic, E2E tests for flows

---

**Happy Coding! 🎉**

For questions, check the code comments in each file or refer to this guide.
