# Investment Platform - Complete Solution

A full-stack investment platform with ROI calculations, multi-level referral system, and automated daily payouts.

## Features

### Core Features
- **User Authentication**: Secure registration/login with JWT tokens
- **Investment Plans**: Three tiers (Silver, Gold, Platinum) with different ROI rates
- **Daily ROI Calculation**: Automated daily returns on investments
- **Multi-Level Referral System**: 5-level referral income distribution
- **Real-time Dashboard**: Comprehensive analytics and charts
- **Automated Scheduler**: Cron jobs for daily ROI and investment maturity

### Investment Plans
- **SILVER**: 2% daily ROI for 180 days ($1,000 - $50,000)
- **GOLD**: 2.5% daily ROI for 200 days ($50,000 - $200,000)
- **PLATINUM**: 3% daily ROI for 365 days ($200,000 - $1,000,000)

### Referral System
- **Level 1**: 10% of direct referral investments
- **Level 2**: 5% of second-level investments
- **Level 3**: 3% of third-level investments
- **Level 4**: 2% of fourth-level investments
- **Level 5**: 1% of fifth-level investments

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for scheduled jobs
- **CORS** for cross-origin requests

### Frontend
- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **shadcn/ui** for UI components

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd assignment-code-completion
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv node-cron
```

#### Frontend Dependencies
```bash
npm install next@latest react@latest react-dom@latest
npm install @types/node @types/react @types/react-dom typescript
npm install tailwindcss postcss autoprefixer
npm install recharts lucide-react
npm install @radix-ui/react-tabs @radix-ui/react-alert-dialog
npm install class-variance-authority clsx tailwind-merge
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/mern-investment

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

### 4. Database Setup

Start MongoDB:
```bash
# For MongoDB locally
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 5. Run the Application

#### Start Backend Server
```bash
node server.js
```

The backend will start on `http://localhost:5000`

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Project Structure

```
assignment-code-completion/
├── app/                          # Next.js app directory
│   ├── auth/                     # Authentication pages
│   ├── page.tsx                  # Main dashboard page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility functions
├── middleware/                   # Express middleware
│   └── auth.js                   # JWT authentication middleware
├── models/                       # Mongoose models
│   ├── User.js                   # User model
│   ├── Investment.js             # Investment model
│   ├── ROIHistory.js             # ROI history model
│   ├── LevelIncome.js            # Level income model
│   └── Referral.js               # Referral model
├── routes/                       # Express routes
│   ├── auth.js                   # Authentication routes
│   ├── user.js                   # User dashboard routes
│   ├── investment.js             # Investment routes
│   └── roi.js                    # ROI analytics routes
├── services/                     # Business logic services
│   ├── roiService.js             # ROI calculation service
│   └── scheduler.js              # Cron job scheduler
├── utils/                        # Utility functions
├── server.js                     # Express server entry point
├── package.json                  # Dependencies and scripts
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── README.md                     # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Dashboard
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/referral-tree` - Get referral tree
- `GET /api/users/referral-stats` - Get referral statistics

### Investments
- `POST /api/investments/create` - Create new investment
- `GET /api/investments/` - Get user investments
- `GET /api/investments/plans` - Get investment plans
- `POST /api/investments/calculate` - Calculate expected returns

### ROI Analytics
- `GET /api/roi/summary` - Get ROI summary
- `GET /api/roi/history` - Get ROI history
- `GET /api/roi/performance` - Get investment performance
- `POST /api/roi/calculate-daily` - Manual ROI calculation (admin)
- `GET /api/roi/scheduler-status` - Get scheduler status

## Automated Processes

### Daily ROI Calculation
- **Schedule**: Every day at 00:00 UTC
- **Process**: Calculates daily ROI for all active investments
- **Idempotency**: Prevents double calculation with tracking

### Investment Maturity
- **Schedule**: Every day at 00:30 UTC
- **Process**: Processes matured investments and returns principal

### Weekly Cleanup
- **Schedule**: Every Sunday at 02:00 UTC
- **Process**: Removes old ROI records (older than 1 year)

## Dashboard Features

### Overview Tab
- Total balance and available funds
- ROI summary with daily averages
- Level income breakdown
- Investment distribution charts
- Recent ROI history trends

### Investments Tab
- List of all investments with details
- Investment status tracking
- Performance metrics

### ROI History Tab
- Detailed ROI transaction history
- Monthly and yearly breakdowns
- Export functionality

### Referrals Tab
- Visual referral tree
- Referral statistics
- Level income tracking

## Testing

### Manual Testing
1. **Registration**: Create a new user account
2. **Login**: Authenticate with the registered user
3. **Create Investment**: Make a test investment
4. **Manual ROI**: Trigger manual ROI calculation
5. **Dashboard**: Verify all data displays correctly

### API Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test dashboard (with token)
curl -X GET http://localhost:5000/api/users/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Input validation
- SQL injection prevention (NoSQL injection protection)
- Rate limiting (can be added)

## Deployment

### Backend Deployment (Example: Railway/Heroku)
1. Set environment variables
2. Deploy the Node.js application
3. Ensure MongoDB is accessible

### Frontend Deployment (Example: Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please ensure compliance with financial regulations in your jurisdiction.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env file

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration

3. **CORS Issues**
   - Ensure frontend URL is allowed
   - Check CORS configuration

4. **Scheduler Not Running**
   - Check server logs
   - Verify cron expressions

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

## Performance Considerations

- Database indexing for frequently queried fields
- Pagination for large datasets
- Caching for dashboard data
- Optimized aggregation queries

## Future Enhancements

- Email notifications
- Two-factor authentication
- Mobile app
- Advanced analytics
- Multiple payment gateways
- Investment portfolio management
- Real-time notifications with WebSockets
