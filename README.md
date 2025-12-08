# Rent Car CRM System

A comprehensive Customer Relationship Management (CRM) system designed specifically for car rental businesses. Built with modern web technologies to streamline operations, manage inventory, track bookings, and handle payments efficiently.

## Features

### Dashboard
- Real-time statistics overview
- Total vehicles, customers, and bookings count
- Revenue tracking (monthly and total)
- Revenue trend visualization with charts
- Recent bookings overview

### Vehicle Management
- Add, edit, and delete vehicles
- Track vehicle details (brand, model, year, VIN, license plate)
- Vehicle categories (sedan, SUV, luxury, sports, van, compact)
- Daily rental rates management
- Real-time vehicle status (available, rented, maintenance)
- Mileage tracking

### Customer Management
- Complete customer profiles
- Search functionality
- Customer information (contact details, license number, address)
- View customer booking history
- Easy customer data management

### Booking Management
- Create and manage bookings
- Automatic total amount calculation based on rental duration
- Vehicle availability checking
- Multiple booking statuses (pending, confirmed, active, completed, cancelled)
- Pickup and return location tracking
- Notes and special requirements

### Payment Tracking
- Record payments for bookings
- Multiple payment methods (cash, credit card, debit card, bank transfer, online)
- Transaction ID tracking
- Payment history
- Total revenue analytics
- Automatic balance calculation

### Authentication & Security
- Secure user login system
- JWT-based authentication
- Role-based access control
- Password encryption with bcrypt

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **date-fns** - Date manipulation

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. Clone or download the project to your local machine

2. Install all dependencies:

**For Windows (PowerShell):**
```powershell
.\install-all.ps1
```

**For Linux/Mac or Git Bash:**
```bash
npm run install-all
```

**Or manually:**
```bash
npm install
cd client
npm install
cd ..
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit the `.env` file and set your configuration:
```
PORT=5000
JWT_SECRET=your_secure_jwt_secret_key_here
NODE_ENV=development
REACT_APP_API_URL=/api
```

## Running the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```

### Option 2: Run Separately

**Backend:**
```bash
npm run server
```
The server will start on `http://localhost:5000`

**Frontend:**
```bash
cd client
npm start
```
The React app will open on `http://localhost:3000`

## Default Login Credentials

To set up a default admin user, you'll need to register first through the API:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@rentcar.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Or using Postman/API client:**
- URL: `POST http://localhost:5000/api/auth/register`
- Body (JSON):
```json
{
  "username": "admin",
  "email": "admin@rentcar.com",
  "password": "admin123",
  "role": "admin"
}
```

Then login with:
- Email: `admin@rentcar.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/:id/bookings` - Get customer bookings
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/:id/payments` - Get booking payments
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `DELETE /api/payments/:id` - Delete payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-bookings` - Get recent bookings
- `GET /api/dashboard/revenue-chart` - Get revenue chart data
- `GET /api/dashboard/popular-vehicles` - Get popular vehicles

## Project Structure

```
rent-car-crm/
├── server/
│   ├── database/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── vehicles.js        # Vehicle routes
│   │   ├── customers.js       # Customer routes
│   │   ├── bookings.js        # Booking routes
│   │   ├── payments.js        # Payment routes
│   │   └── dashboard.js       # Dashboard routes
│   └── index.js               # Server entry point
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.js      # Navigation bar
│       │   └── Sidebar.js     # Sidebar navigation
│       ├── pages/
│       │   ├── Login.js       # Login page
│       │   ├── Dashboard.js   # Dashboard page
│       │   ├── Vehicles.js    # Vehicle management
│       │   ├── Customers.js   # Customer management
│       │   ├── Bookings.js    # Booking management
│       │   └── Payments.js    # Payment tracking
│       ├── services/
│       │   └── api.js         # API service layer
│       ├── App.js             # Main app component
│       └── index.js           # React entry point
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Database Schema

The system uses SQLite with the following tables:

- **users** - System users with authentication
- **customers** - Customer information
- **vehicles** - Vehicle inventory
- **bookings** - Rental bookings
- **payments** - Payment records
- **maintenance** - Vehicle maintenance tracking

## Features in Detail

### Automatic Calculations
- Booking total amount is automatically calculated based on vehicle daily rate and rental duration
- Remaining balance is tracked automatically when payments are recorded

### Real-time Updates
- Vehicle status changes automatically based on booking status
- Available vehicles are filtered when creating new bookings
- Dashboard statistics update in real-time

### Validation
- Input validation on both frontend and backend
- Duplicate detection for license plates, VINs, and emails
- Date range validation for bookings
- Vehicle availability checking

## Deployment

For production deployment to Vercel, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your_secure_key`
   - `PORT=5000`
4. Deploy!

**Note:** For production, consider replacing SQLite with a cloud database (PostgreSQL, MongoDB, etc.)

## Future Enhancements

Potential features for future versions:
- Email notifications for booking confirmations
- SMS reminders for pickup/return dates
- Advanced reporting and analytics
- Document upload (licenses, insurance)
- Multi-location support
- Mobile responsive design improvements
- Vehicle maintenance scheduling
- Customer loyalty program
- Integration with payment gateways
- Advanced search and filtering
- Export data to PDF/Excel

## Contributing

This is a demonstration project. Feel free to fork and modify according to your needs.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions, please open an issue in the project repository.

## Credits

Developed as a comprehensive CRM solution for car rental businesses.
