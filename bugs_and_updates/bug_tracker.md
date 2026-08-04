# MoreThanMe Application — Complete Bug & Improvement Tracker

This document catalogs every bug, error, build/linter warning, UI/UX improvement, and security/backend issue discovered during our comprehensive deep-dive audit of the codebase.

**Current Audit Status:** AUDIT COMPLETED  
**Total Issues Logged:** 20  
**Changes Made to Codebase:** NONE (As requested, we are only logging and organizing for now)

---

## Table of Contents
1. [High Priority: Security, Data Integrity & API Errors](#1-high-priority-security-data-integrity--api-errors)
2. [Medium Priority: Form Validation, Auth & Business Logic](#2-medium-priority-form-validation-auth--business-logic)
3. [Medium Priority: Build, Linter Warnings & Code Cleanliness](#3-medium-priority-build-linter-warnings--code-cleanliness)
4. [Low Priority / UI & UX Improvements](#4-low-priority--ui--ux-improvements)
5. [Next Steps: Suggested Resolution Plan](#5-next-steps-suggested-resolution-plan)

---

## 1. High Priority: Security, Data Integrity & API Errors

### BUG-001: Missing Rate Limiting / DoS Protection on Gemini OCR Endpoint
- **File:** `src/app/api/parse-receipt/route.ts` & `src/app/api/gemini-proxy/route.ts`
- **Type:** Security / Resource Exhaustion
- **Description:** The OCR endpoint (`/api/parse-receipt`) and proxy (`/api/gemini-proxy`) accept arbitrary base64 image uploads and send them to Google Gemini API without rate-limiting, CAPTCHA, or authentication.
- **Impact:** Malicious actors could spam the endpoint, exhausting your Gemini API quota or causing rate limit errors (HTTP 429) for legitimate donors.
- **Proposed Fix:** Implement IP-based rate limiting (or a simple rate-limit token bucket in memory/Firebase) and limit file sizes strictly before processing.

### BUG-002: Inconsistent Receipt Normalization Date Handling
- **File:** `src/app/api/donations/route.ts` (Lines 4-15)
- **Type:** Data Parsing / Logic Bug
- **Description:** `normalizeReceiptDateTime()` attempts to parse dates like `"DD/MM/YYYY"` via regex `^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})`, but if the string has a time attached or is `"YY"` format, or if month/day are ambiguous, it can return NaN or fall back to returning raw un-parsable strings to Firestore timestamp fields.
- **Impact:** Can cause runtime queries or admin dashboard charts to fail when parsing invalid `receipt_date_time` strings.
- **Proposed Fix:** Ensure robust date parsing and always store standard ISO-8601 strings or `null` if parsing fails.

### BUG-003: Public Assets Upload Folder Restriction Can Be Spoofed
- **File:** `src/app/api/upload/public/route.ts`
- **Type:** Security / Storage Management
- **Description:** The public upload API checks if `folder !== "morethanme/team"`, but this folder is passed in `formData`. Since there is no auth, anyone can upload unlimited arbitrary images to Cloudinary inside `morethanme/team`.
- **Impact:** Potential Cloudinary storage exhaustion or abuse.
- **Proposed Fix:** Enforce a strict file size limit (e.g. max 5MB), restrict MIME types strictly to `image/jpeg` and `image/png`, and strip any untrusted folder override.

### BUG-004: Race Condition in `team_members` Sort Order Assigning
- **File:** `src/app/api/join/route.ts` (Lines 26-31)
- **Type:** Backend Concurrency Bug
- **Description:** When a new volunteer signs up via `/api/join`, the server queries `orderBy("sort_order", "desc").limit(1)` and sets `nextSortOrder = max + 1`. Under concurrent signups, multiple members can get the exact same `sort_order`.
- **Impact:** Team members and volunteers list ordering can become unpredictable or duplicate sort numbers.
- **Proposed Fix:** Use a Firestore transaction or simply use timestamps as the secondary tie-breaker in sorting queries.

---

## 2. Medium Priority: Form Validation, Auth & Business Logic

### BUG-005: Volunteer Initial Password Security Policy [RESOLVED]
- **File:** `src/app/joinUs/page.tsx` & `src/app/api/join/route.ts`
- **Type:** Authentication / Security Policy
- **Description:** Volunteer accounts were lazily initialized with their lowercase email address as their default password (`has_default_password: true`).
- **Resolution:** Added a required password field (minimum 6 characters) to the `/joinUs` signup form. In `/api/join/route.ts`, this password is now securely hashed with `bcrypt` and saved to `team_members` with `has_default_password: false`.

### BUG-006: Duplicate Volunteer Application Routes and Collections [RESOLVED]
- **File:** `/api/join` (`team_members` collection) vs. `/api/volunteers/join` (`volunteers` collection)
- **Type:** Architectural Inconsistency / Data Duplication
- **Description:** Two different volunteer registration systems existed, with `/api/volunteers/join` strictly requiring `@rishihood.edu.in` emails and writing to a separate `volunteers` collection.
- **Resolution:** Removed the `@rishihood.edu.in` email restriction from `/api/volunteers/join/route.ts` and unified it to insert into the `team_members` collection with `role: "Volunteer"`.

### BUG-007: `send-donation-email` Endpoint is a Stub [IGNORED / DEFERRED]
- **File:** `src/app/api/send-donation-email/route.ts`
- **Type:** Missing Feature / Business Logic
- **Description:** The endpoint `/api/send-donation-email` currently only logs `"Donation notification sent successfully"` and returns 200 without sending an email.
- **Status:** Temporarily ignored per user instructions.

### BUG-008: Newsletter Bulk Email Sending Timeout Risk [RESOLVED]
- **File:** `src/app/api/newsletter/send/route.ts` & `src/lib/brevo.ts`
- **Type:** Performance / API Reliability
- **Description:** Bulk newsletter sending looped sequentially through batches of 50 emails inside a single HTTP API request, risking serverless timeouts.
- **Resolution:** Implemented Brevo's native Campaign & List APIs (`getOrCreateNewsletterList`, `importContactsToList`, and `sendNewsletterCampaign`). In `/api/newsletter/send/route.ts`, broadcasts now create/update a Brevo List, create a Brevo Email Campaign, and call `sendNow` (2–3 fast API calls total without any batching loop). Test sends (`testMode: true`) continue to use instant transactional email sending.

---

## 3. Medium Priority: Build, Linter Warnings & Code Cleanliness

### BUG-009: Missing React Hook Dependency in Admin Donate Page
- **File:** `src/app/admin/donate/page.tsx` (Line 94)
- **Type:** Linter Error / React Hook Issue
- **Description:** ESLint reports `react-hooks/exhaustive-deps` error on `useEffect` animating total amounts (`stats.totalAmount`).
- **Impact:** Potential stale closure or unexpected re-animation behavior when state changes.
- **Proposed Fix:** Include required dependencies in the dependency array or restructure the animation ref loop.

### BUG-010: Unoptimized Standard `<img>` Tags in Volunteer Portal
- **File:**
  - `src/app/volunteer/availability/page.tsx` (Lines 662, 817)
  - `src/app/volunteer/layout.tsx` (Line 153)
  - `src/app/volunteer/profile/page.tsx` (Lines 220, 283)
- **Type:** Next.js Linter Error (`@next/next/no-img-element`)
- **Description:** Using raw HTML `<img>` tags instead of Next.js `<Image />` component.
- **Impact:** Misses automatic WebP/AVIF compression, lazy loading, and responsive sizing.
- **Proposed Fix:** Replace `<img>` tags with Next.js `<Image />` or properly configure visual suppressions if external Cloudinary URLs are dynamic.

### BUG-011: Unused Variables and Imports Across 18 Files
- **File:** Numerous files (`src/app/about/page.tsx`, `src/app/admin/admins/page.tsx`, `src/app/admin/assets/page.tsx`, `DonationForm.tsx`, `DonorShowcase.jsx`, `our-family/page.tsx`, etc.)
- **Type:** ESLint Warnings (`@typescript-eslint/no-unused-vars`)
- **Description:** 38 ESLint warnings for unused state setters, unused icons (`ImageIcon`, `Video`, `Trash2`, `Heart`, etc.), and unused API fetch helpers (`fetchTeam`, `setUploadKey`).
- **Impact:** Bloats bundle size slightly and clutters build output.
- **Proposed Fix:** Clean up unused imports and remove dead code variables across components.

### BUG-012: Deprecated Next.js `middleware.ts` Convention Warning
- **File:** `src/middleware.ts`
- **Type:** Next.js 16 Build Warning
- **Description:** Next.js 16.1.4 build emits: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- **Impact:** Future Next.js major upgrades may break routing or JWT cookie verification if not migrated.
- **Proposed Fix:** Plan migration from `middleware.ts` to Next.js 16 proxy convention as per official Next.js documentation.

---

## 4. Low Priority / UI & UX Improvements

### BUG-013: Donation Form Modal Mobile Responsiveness
- **File:** `src/components/DonationForm.tsx` & `src/components/DonationForm.jsx`
- **Type:** UI/UX Improvement
- **Description:** The receipt uploader and UPI QR code section inside `DonationForm` can overflow vertically on small mobile viewports (iPhone SE / Android devices under 680px height).
- **Impact:** Users have to scroll awkwardly inside a modal dialog to click the final "Submit Donation" button.
- **Proposed Fix:** Make the modal body scrollable with a fixed bottom action bar on mobile screens.

### BUG-014: Missing Empty States for Photo Gallery Filters
- **File:** `src/components/PhotoGallery.tsx`
- **Type:** UI/UX Improvement
- **Description:** When filtering media by a specific category (e.g., "Celebration" or "Health") that has no uploaded items yet, the grid shows blank space without a friendly explanatory message.
- **Impact:** Users might think the website is broken or still loading.
- **Proposed Fix:** Add a friendly empty-state illustration or message: *"No photos found in this category yet. Check back soon!"*

### BUG-015: Volunteer Availability Cutoff Feedback
- **File:** `src/app/volunteer/availability/page.tsx`
- **Type:** UI/UX Improvement
- **Description:** If a volunteer tries to toggle availability for today after 6:00 PM, the API returns a 400 error (`"Today's availability closes at 6:00 PM"`), but the UI could proactively disable the button or show a timer badge before they click.
- **Impact:** Prevents frustration by making cutoff rules visually obvious in the calendar UI.

### BUG-016: Mixed JavaScript `.jsx` and TypeScript `.tsx` Components
- **File:** `src/components/DonationForm.jsx` vs `src/components/DonationForm.tsx` (and `DonorShowcase.jsx`)
- **Type:** Codebase Consistency
- **Description:** There is a duplicate `.jsx` version of `DonationForm` alongside the `.tsx` version, and some components are still in vanilla JSX without TypeScript types.
- **Impact:** Maintenance confusion (which component is active?) and missing type safety.
- **Proposed Fix:** Remove legacy `.jsx` duplicate files and ensure all components use TypeScript (`.tsx`).

### BUG-017: No Client-Side File Size Limit Indicator on Image Uploads
- **File:** `src/app/joinUs/page.tsx` (`CloudinaryUpload` component)
- **Type:** UI/UX Improvement
- **Description:** Although `maxSizeMB={10}` is passed, users attempting to upload large photos on mobile connectivity don't see progress percentage or clear file-too-large warnings before upload starts.
- **Proposed Fix:** Add drag-and-drop progress bars and proactive file-size checks with instant Toast alerts.

### BUG-018: Newsletter Markdown / HTML Preview Rendering Safety
- **File:** `src/app/admin/newsletters/send/page.tsx` & `src/lib/brevo.ts`
- **Type:** UI/UX & Email Compatibility
- **Description:** HTML newsletter email content generated from markdown or rich text should be styled inline for Outlook / Gmail compatibility.
- **Proposed Fix:** Ensure all CSS styles in `wrapEmailContent` use inline CSS attributes and table-friendly email layouts.

### BUG-019: Missing Loading Skeleton in "Our Family" Team Grid
- **File:** `src/app/our-family/page.tsx`
- **Type:** UI/UX Improvement
- **Description:** While fetching `team_members` and `donors`, the page shows a basic loader instead of modern skeleton placeholder cards.
- **Proposed Fix:** Implement Tailwind shimmer skeleton cards for a smoother, premium loading experience.

### BUG-020: Hardcoded NGO Upi Id & Payee Display Name
- **File:** `src/components/DonationForm.tsx` (Lines 61-63)
- **Type:** Configuration Hardcoding
- **Description:** UPI ID (`"8088133722@kotakbank"`) and Payee name (`"MoreThanMe"`) are hardcoded in component state rather than fetched from `site_settings` or environment variables.
- **Impact:** Changing bank accounts requires a code redeployment instead of a simple admin dashboard update.
- **Proposed Fix:** Fetch donation UPI config dynamically from the `/api/site-settings` endpoint.

---

## 5. Next Steps: Suggested Resolution Plan

We can tackle these issues methodically one by one without overwhelming the project:

1. **Phase 1: Code Cleanliness & Build Health (BUG-009, 010, 011, 016)**
   - Remove legacy `.jsx` duplicates, clear out ESLint unused warnings, and fix Next.js image/hook lint rules.
2. **Phase 2: Security & Backend Robustness (BUG-001, 002, 003, 004, 005)**
   - Tighten OCR API validation, secure public uploads, fix date formatting in Firestore, and strengthen volunteer login policies.
3. **Phase 3: Business Logic & Feature Polish (BUG-006, 007, 008, 020)**
   - Connect email notification receipts (`brevo`), unify volunteer signup collections, and move hardcoded UPI details to `site_settings`.
4. **Phase 4: UI/UX & Premium Design Polish (BUG-013, 014, 015, 017, 019)**
   - Add empty states, skeleton loaders, mobile modal improvements, and interactive calendar availability feedback.
