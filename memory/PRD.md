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

### Safety Features
- [x] Emergency SOS button with contacts notification
- [x] Fatigue monitor
- [x] Wake-up timer/alarm
- [x] DOT Compliance tracker

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
- [x] Driver leaderboard

### Admin Features
- [x] Admin dashboard
- [x] User management
- [x] System statistics

### Subscription & Payments
- [x] Subscription plans (Free, Pro, Premium)
- [x] Stripe integration ready

### Document Management
- [x] Document scanner/uploader
- [x] Document categorization (BOL, POD, etc.)

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
- `/api/location/share` - Share location with convoy members (NEW)
- `/api/location/shared-with-me/{email}` - Get locations shared with you (NEW)

## Recent Updates (January 2026)

### Session: January 10, 2026
- Fixed Emergency SOS API (removed duplicate endpoint conflict)
- Integrated Google Maps with API key
- Fixed compliance API datetime timezone bug
- Fixed HOS endpoint missing field handling
- Integrated SpotReviews component into ParkingDetails page
- Fixed yellow accent color issue on parking details page
- **Added Partner/Parking Owner Subscription Plans** (Starter $0, Business $29.99, Enterprise $99.99)
- **Added Share Location Feature** for convoy members
- All backend tests passing (26/26 - 100%)
- All frontend flows working

## Known Issues
- Google Maps shows "development purposes only" watermark (needs billing enabled)
- React key warning in Trip Calculator (minor cosmetic)

## Future Enhancements (Backlog)
1. Convert PWA to native app (Capacitor/React Native)
2. AI-powered smart alerts system
3. Integrated fuel card
4. Voice-activated assistant
5. Enhanced route planner with truck restrictions
6. Refactor server.py into modular routers
7. Refactor DriverDashboard.js into smaller components

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
