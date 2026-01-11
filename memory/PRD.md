# TrukAll - Product Requirements Document

## Overview
TrukAll is a comprehensive Progressive Web App (PWA) for truck drivers that solves critical pain points including finding safe parking, real-time lot availability, avoiding tickets, locating amenities, and mitigating driver fatigue.

## Tech Stack
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, Axios
- **Backend**: FastAPI, Pydantic, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Maps**: Google Maps API
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
- [x] **Analytics Dashboard** - Earnings tracking, expense breakdown, performance metrics (NEW)
- [x] **Truck Route Planner** - Route planning with truck restrictions (NEW)
- [x] **Voice Commands** - Hands-free voice search (NEW)
- [x] **Photo Reviews** - Photo uploads for parking reviews (NEW)
- [x] **In-App Messaging** - Direct messaging between drivers (NEW)
- [x] **Push Notifications** - Backend API ready (NEW)

### Safety Features
- [x] Emergency SOS button with contacts notification
- [x] Fatigue monitor
- [x] Wake-up timer/alarm
- [x] DOT Compliance tracker
- [x] **Weather & Road Alerts** (NEW)

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
- `/api/analytics/{email}` - Driver analytics dashboard (NEW)
- `/api/routes/plan` - Truck route planning (NEW)
- `/api/voice/search` - Voice command processing (NEW)
- `/api/reviews/photo` - Photo reviews (NEW)
- `/api/messages/send` - Direct messaging (NEW)
- `/api/messages/conversations/{email}` - Get conversations (NEW)
- `/api/push/vapid-key` - Push notification keys (NEW)

## Recent Updates (January 2026)

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
