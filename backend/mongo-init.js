// MongoDB initialization script
db = db.getSiblingDB('emergency-bed-booking');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'email', 'password', 'role', 'phone', 'location'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { enum: ['admin', 'hospital', 'driver'] },
        phone: { bsonType: 'string' },
        location: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('hospitals', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'location', 'phone', 'bedsAvailable'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        location: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        bedsAvailable: { bsonType: 'number' }
      }
    }
  }
});

db.createCollection('requests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingId', 'hospitalId', 'driverId', 'patientName', 'patientPhone'],
      properties: {
        bookingId: { bsonType: 'string' },
        hospitalId: { bsonType: 'string' },
        driverId: { bsonType: 'string' },
        patientName: { bsonType: 'string' },
        patientPhone: { bsonType: 'string' }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ id: 1 }, { unique: true });
db.hospitals.createIndex({ id: 1 }, { unique: true });
db.requests.createIndex({ bookingId: 1 }, { unique: true });
db.requests.createIndex({ hospitalId: 1 });
db.requests.createIndex({ driverId: 1 });
db.requests.createIndex({ status: 1 });
db.requests.createIndex({ createdAt: 1 });

// Insert sample data
db.users.insertMany([
  {
    id: 'A001',
    name: 'Super Admin',
    email: 'admin@emergency.com',
    password: '$2a$10$abc123...', // This will be hashed properly
    role: 'admin',
    phone: '9876543210',
    location: 'Trichy',
    department: 'Emergency Management',
    isActive: true,
    lastLogin: new Date()
  },
  {
    id: 'H001',
    name: 'KMC Hospital',
    email: 'kmc@hospital.com',
    password: '$2a$10$abc123...', // This will be hashed properly
    role: 'hospital',
    phone: '9876543212',
    location: 'Srirangam, Trichy',
    department: 'Emergency Ward',
    hospitalId: 'H001',
    bedsAvailable: 50,
    isActive: true,
    lastLogin: new Date()
  },
  {
    id: 'D001',
    name: 'Raj Kumar',
    email: 'driver1@emergency.com',
    password: '$2a$10$abc123...', // This will be hashed properly
    role: 'driver',
    phone: '9876543215',
    location: 'Trichy',
    department: 'Emergency Services',
    licenseNo: 'TN-01-2023-0001',
    ambulanceNo: 'TN-01-AB-1234',
    isActive: true,
    lastLogin: new Date()
  }
]);

db.hospitals.insertMany([
  {
    id: 'H001',
    name: 'KMC Hospital',
    location: 'Srirangam, Trichy',
    phone: '9876543212',
    bedsAvailable: 50,
    bedTypes: {
      icu: 10,
      emergency: 20,
      general: 15,
      private: 5,
      deluxe: 0
    },
    speciality: 'General',
    isActive: true,
    coordinates: { lat: 10.8597, lng: 78.7029 },
    address: 'Srirangam, Trichy, Tamil Nadu'
  },
  {
    id: 'H002',
    name: 'Apollo Hospital',
    location: 'Woraiyur, Trichy',
    phone: '9876543213',
    bedsAvailable: 30,
    bedTypes: {
      icu: 8,
      emergency: 12,
      general: 10,
      private: 0,
      deluxe: 0
    },
    speciality: 'Multi-Specialty',
    isActive: true,
    coordinates: { lat: 10.7905, lng: 78.6842 },
    address: 'Woraiyur, Trichy, Tamil Nadu'
  },
  {
    id: 'H003',
    name: 'Govt Hospital',
    location: 'Trichy',
    phone: '9876543214',
    bedsAvailable: 40,
    bedTypes: {
      icu: 15,
      emergency: 15,
      general: 10,
      private: 0,
      deluxe: 0
    },
    speciality: 'General',
    isActive: true,
    coordinates: { lat: 10.7903, lng: 78.7047 },
    address: 'Trichy, Tamil Nadu'
  }
]);

print('MongoDB initialized with sample data');
