# Emergency Bed Booking Backend

## 🚀 Node.js + Express + MongoDB Backend

### 📋 Prerequisites
- Node.js 16+ installed
- MongoDB installed and running
- Git for version control

### 🛠️ Installation

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

4. **Start Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 📡 API Endpoints

#### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user
- `GET /api/auth/verify` - Verify JWT token

#### **Hospitals**
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create hospital
- `PUT /api/hospitals/:id` - Update hospital
- `PUT /api/hospitals/:id/beds` - Update bed availability
- `GET /api/hospitals/locations/unique` - Get unique locations

#### **Requests**
- `GET /api/requests` - Get all requests
- `GET /api/requests/hospital/:hospitalId` - Get requests for hospital
- `GET /api/requests/driver/:driverId` - Get requests for driver
- `POST /api/requests` - Create new request
- `PUT /api/requests/:bookingId/status` - Update request status
- `GET /api/requests/:bookingId` - Get request by booking ID
- `DELETE /api/requests/:bookingId` - Delete request
- `GET /api/requests/stats/summary` - Get request statistics

#### **Users**
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/role/:role` - Get users by role

### 🗄️ Database Models

#### **User Model**
```javascript
{
  id: String (unique),
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'hospital', 'driver'],
  phone: String,
  location: String,
  department: String,
  hospitalId: String,
  bedsAvailable: Number,
  licenseNo: String,
  ambulanceNo: String,
  isActive: Boolean,
  lastLogin: Date
}
```

#### **Hospital Model**
```javascript
{
  id: String (unique),
  name: String,
  location: String,
  phone: String,
  bedsAvailable: Number,
  bedTypes: {
    icu: Number,
    emergency: Number,
    general: Number,
    private: Number,
    deluxe: Number
  },
  speciality: String,
  isActive: Boolean,
  coordinates: { lat: Number, lng: Number },
  address: String
}
```

#### **Request Model**
```javascript
{
  bookingId: String (unique),
  hospitalId: String,
  hospitalName: String,
  driverId: String,
  driverName: String,
  patientName: String,
  patientAge: Number,
  patientPhone: String,
  emergencyType: ['normal', 'emergency', 'critical'],
  bedType: ['general', 'icu', 'emergency', 'private', 'deluxe'],
  notes: String,
  eta: String,
  distance: String,
  status: ['pending', 'accepted', 'rejected'],
  isNew: Boolean,
  source: ['manual', 'voice'],
  createdAt: Date,
  updatedAt: Date
}
```

### 🔐 Authentication

**JWT Token Structure:**
```javascript
{
  userId: String,
  id: String,
  role: String,
  iat: Number,
  exp: Number
}
```

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

### 🌐 CORS Configuration

**Development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

**Production:**
- Update FRONTEND_URL in .env

### 📊 Sample API Calls

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver1@emergency.com", "password": "driver123"}'
```

**Get Hospitals:**
```bash
curl -X GET http://localhost:5000/api/hospitals?location=Trichy \
  -H "Authorization: Bearer <jwt_token>"
```

**Create Request:**
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "bookingId": "REQ123",
    "hospitalId": "H001",
    "hospitalName": "KMC Hospital",
    "driverId": "D001",
    "driverName": "Raj Kumar",
    "patientName": "John Doe",
    "patientPhone": "9876543210",
    "emergencyType": "emergency",
    "bedType": "icu"
  }'
```

### 🚀 Deployment

**Local Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Docker (optional):**
```bash
docker build -t emergency-backend .
docker run -p 5000:5000 emergency-backend
```

### 📝 Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/emergency-bed-booking
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 🔧 Features

- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ Real-time request management
- ✅ Hospital bed tracking
- ✅ Driver request creation
- ✅ Request status updates
- ✅ User management
- ✅ Hospital management
- ✅ Statistics and analytics
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling
- ✅ Security headers

### 🐛 Troubleshooting

**MongoDB Connection Error:**
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check network connectivity

**JWT Token Error:**
- Verify JWT_SECRET in .env
- Check token expiration
- Verify token format

**CORS Error:**
- Update FRONTEND_URL in .env
- Check frontend URL
- Verify CORS configuration

### 📞 Support

For issues and questions:
1. Check MongoDB connection
2. Verify environment variables
3. Check API endpoint documentation
4. Review error logs
