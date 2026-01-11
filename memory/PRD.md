# TrukAll - Product Requirements Document

## Overview
TrukAll is a comprehensive Progressive Web App (PWA) for truck drivers that solves critical pain points including finding safe parking, real-time lot availability, avoiding tickets, locating amenities, and mitigating driver fatigue.

## Tech Stack
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, Axios
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Maps**: Google Maps API
- **Payments**: Stripe
- **Analytics**: Google Analytics, Microsoft Clarity (placeholder)
- **PWA**: Service Worker, Web Manifest

## Core Features (Implemented)

### Authentication & Users
- [x] Multi-role authentication (Driver, Partner, Admin)
- [x] Password reset functionality
- [x] JWT-based login
- [x] User profile management

### Driver Dashboard
- [x] Google Maps integration with parking markers
- [x] Real-time parking availability (driver-powered)
- [x] Live parking updates tab
- [x] Parking search by city
- [x] Booking/reservation system
- [x] Reward points system
- [x] Notification bell with real-time alerts
- [x] **Analytics Dashboard** - Earnings tracking, expense breakdown, performance metrics
- [x] **Truck Route Planner** - Route planning with truck restrictions
- [x] **Voice Commands** - Hands-free voice search
- [x] **Photo Reviews** - Photo uploads for parking reviews
- [x] **In-App Messaging** - Direct messaging between drivers
- [x] **Push Notifications** - Backend API ready

### Community & Engagement (NEW - Jan 11, 2026)
- [x] **Community Board** - Forum-style posts with categories (General, Tips, Routes, Parking, Deals, Questions, Announcements)
- [x] **Referral System** - Unique referral codes, 500 points for referrer, 250 for new user
- [x] **Feedback Form** - In-app feedback with 5 types (General, Bug, Feature, Praise, Complaint) + Google Forms link
- [x] **Social Links** - WhatsApp Business, Telegram, Facebook, Google My Business, Notion docs

### Analytics & Tracking (NEW - Jan 11, 2026)
- [x] **Google Analytics** - Page views, events tracking
- [x] **Microsoft Clarity** - Heatmaps, session recordings (placeholder ID)

### Safety Features
- [x] Emergency SOS button with contacts notification
- [x] Fatigue monitor
- [x] Wake-up timer/alarm
- [x] DOT Compliance tracker
- [x] **Weather & Road Alerts**

### Financial Tools
- [x] Load board for finding jobs
- [x] Expense tracker
- [x] Trip profitability calculator
- [x] Detention time claims

### Amenities & Services
- [x] Shower credits tracker
- [x] Retail parking database (Walmart, etc.)
- [x] Fuel price alerts
- [x] Broker ratings with fraud detection

### Community Features
- [x] Community reviews for parking spots
- [x] Convoy finder
- [x] **Convoy Chat** (NEW) - Direct messaging within convoys
- [x] Driver leaderboard
- [x] Share location with convoy members

### Admin Features
- [x] Admin dashboard
- [x] User management
- [x] System statistics

### Subscription & Payments
- [x] Driver subscription plans (Free, Pro, Premium)
- [x] Partner subscription plans (Starter, Business, Enterprise)
- [x] **Stripe checkout integration** (test mode ready)
- [x] Subscription success page
- [x] Payment webhook handling

### Document Management
- [x] Document scanner/uploader
- [x] Document categorization (BOL, POD, etc.)

### Legal & Compliance Pages
- [x] **Privacy Policy** page (/privacy)
- [x] **Terms of Service** page (/terms)
- [x] Terms agreement checkbox on signup
- [x] Footer links to all legal pages

## Test Credentials
- **Driver**: driver@test.com / password123
- **Partner**: partner@test.com / password123
- **Admin**: admin@test.com / password123

## API Endpoints Summary
- `/api/auth/login` - User authentication
- `/api/users/` - User registration
- `/api/parking-spots` - Parking CRUD
- `/api/spots/live-updates` - Real-time parking data
- `/api/emergency/sos` - Emergency SOS
- `/api/subscriptions/plans` - Subscription management (supports `?plan_type=partner` for partner plans)
- `/api/compliance/{email}` - DOT compliance
- `/api/fuel-prices` - Fuel prices
- `/api/loads` - Load board
- `/api/reviews` - Parking reviews
- `/api/brokers` - Broker ratings
- `/api/location/share` - Share location with convoy members
- `/api/location/shared-with-me/{email}` - Get locations shared with you
- `/api/analytics/{email}` - Driver analytics dashboard
- `/api/routes/plan` - Truck route planning
- `/api/voice/search` - Voice command processing
- `/api/reviews/photo` - Photo reviews
- `/api/messages/send` - Direct messaging
- `/api/messages/conversations/{email}` - Get conversations
- `/api/push/vapid-key` - Push notification keys
- `/api/feedback` - Submit/get user feedback (NEW)
- `/api/community/posts` - Community board posts CRUD (NEW)
- `/api/community/categories` - Get community categories (NEW)
- `/api/community/posts/{id}/like` - Like a post (NEW)
- `/api/community/posts/{id}/comments` - Add comment (NEW)
- `/api/referral/code/{email}` - Get/create referral code (NEW)
- `/api/referral/apply` - Apply referral code (NEW)
- `/api/referral/stats/{email}` - Get referral stats (NEW)
- `/api/referral/leaderboard` - Top referrers (NEW)
- `/api/app/config` - App configuration & social links (NEW)

## Recent Updates (January 2026)

### Session: January 11, 2026 (COMMUNITY & ENGAGEMENT FEATURES)
- **Feedback Form** - In-app feedback with 5 types (General, Bug, Feature, Praise, Complaint) + Google Forms link, awards 25-50 points
- **Community Board** - Forum-style posts with 7 categories, likes, comments, awards 20 points per post
- **Referral System** - Unique referral codes (TRUK + hash), 500 pts for referrer, 250 for new user
- **Social Links Page** - WhatsApp Business, Telegram, Facebook, Google Business, Notion (placeholder URLs)
- **Microsoft Clarity** - Added tracking script (placeholder ID)
- All 19 backend tests passing (100%)
- All 4 new frontend tabs working

### Session: January 11, 2026 (FREE ENGAGEMENT FEATURES - NO EXTERNAL COSTS)
- **Gamification System** - 19 badges, 6 categories, daily/weekly challenges, streaks, levels (1 per 500 pts)
- **Driver Spotlight** - Weekly featured Top Reviewer, Most Helpful, Streak Champion
- **Mentor System** - Register as mentor, request mentors, specialties, rating system
- **Maintenance Tracker** - 8 default types (oil, tires, brakes, filters, etc.), auto-calculate next due
- **Rewards Store** - 8 redeemable rewards using points (Premium, Badges, Ad-Free, etc.)
- Fixed route conflict: renamed old /maintenance to /maintenance-reminders
- All 22 backend tests passing (100%)
- All 5 new frontend tabs working

### Session: January 11, 2026 (6 NEW FEATURES ADDED)
- **Analytics Dashboard** - Track earnings, expenses, miles, loads with Week/Month/Year views
- **Truck Route Planner** - Plan routes with truck-specific restrictions (height, weight, hazmat, tolls)
- **Voice Commands** - Hands-free voice search using Web Speech API
- **Photo Reviews** - Add photos to parking spot reviews with star ratings
- **In-App Messaging** - Direct messaging between drivers with conversation list
- **Push Notifications** - Backend API ready (VAPID keys), frontend service worker integration
- Fixed RoutePlanner API field names to match backend (origin_address, truck_height_ft, etc.)
- Fixed PhotoReviews API paths (/api/reviews/photo)
- All 17 new backend tests passing (100%)
- All 5 frontend feature tabs working and tested

### Session: January 10, 2026
- Fixed Emergency SOS API (removed duplicate endpoint conflict)
- Integrated Google Maps with API key
- Fixed compliance API datetime timezone bug
- Fixed HOS endpoint missing field handling
- Integrated SpotReviews component into ParkingDetails page
- Fixed yellow accent color issue on parking details page
- **Added Partner/Parking Owner Subscription Plans** (Starter $0, Business $29.99, Enterprise $99.99)
- **Added Share Location Feature** for convoy members
- **Added Notification System** with bell icon, real-time alerts
- **Convoy join now triggers notifications** to convoy leader
- Removed "Made with Emergent" badge for production
- All backend tests passing (24/24 new + 26 previous = 100%)
- All frontend flows working
- **APP IS LAUNCH READY**

## Known Issues
- Google Maps shows deprecation warning for google.maps.Marker (minor, not blocking)
- Voice Commands requires browser microphone permission
- Push Notifications requires browser notification permission

## Future Enhancements (Backlog)
1. Convert PWA to native app (Capacitor/React Native)
2. AI-powered smart alerts system
3. Integrated fuel card
4. Refactor server.py into modular routers (urgent - file is very large)
5. Refactor DriverDashboard.js into smaller components (urgent - file is very large)

## File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI app (monolithic)
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── DriverDashboard.js
│   │   │   ├── ParkingDetails.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── PartnerDashboard.js
│   │   ├── components/
│   │   │   ├── SpotReviews.js
│   │   │   └── ui/
│   │   └── App.js
│   └── package.json
├── scripts/
│   └── seed_data.py
├── tests/
│   └── test_trukall_api.py
└── test_reports/
    └── iteration_2.json
```
