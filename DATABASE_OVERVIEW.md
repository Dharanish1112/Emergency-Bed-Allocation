# Database Overview - Emergency Bed Booking System

## 🗄️ Database Setup

### Primary Database: **Firebase Firestore**
- **Package**: `firebase: ^12.12.0`
- **Usage**: Real-time cloud database
- **Location**: Cloud-based (Google Firebase)

### Secondary Database: **LocalStorage**
- **Usage**: Browser-based storage for real-time sync
- **Purpose**: Shared data between different user roles

---

## 📊 Data Storage Structure

### 1. Firebase Firestore Collections
```
- drivers/          # Driver information and status
- hospitals/         # Hospital data and bed availability  
- bookings/          # Booking requests and status
- users/            # User authentication data
```

### 2. LocalStorage Keys
```javascript
{
  "bookingRequests": [],     # Array of booking requests from drivers
  "hospitalBeds": {},        # Hospital bed availability data
  "requestStatuses": {},     # Request status tracking
  "simpleExcelUser": {},     # Current logged-in user data
  "voiceBookings": [],       # Voice booking records
  "auth": "true/false"      # Authentication status
}
```

---

## 🔄 Data Flow Between Devices

### **Driver Device** → **Hospital Device**
```
1. Driver creates request → LocalStorage → Firebase
2. Hospital sees request → Firebase → LocalStorage
3. Hospital accepts/rejects → LocalStorage → Firebase
4. Driver sees status → Firebase → LocalStorage
```

### **Data Shared Across All Devices**
- **Hospital Locations**: Trichy, Chennai, Coimbatore, Bangalore
- **Hospital Names**: KMC, Apollo, Govt, SRM, PSG, KMCH
- **Bed Types**: ICU, Emergency, General, Private, Deluxe
- **User Roles**: Admin, Hospital, Driver

---

## 📱 Device-Specific Data

### **Driver Device Shows:**
- ✅ Available hospitals in their location
- ✅ Hospital bed counts and types
- ✅ Request creation form
- ✅ Their booking status
- ✅ Voice booking interface

### **Hospital Device Shows:**
- ✅ Incoming requests from drivers
- ✅ Patient details and emergency type
- ✅ Accept/Reject buttons
- ✅ Bed availability management
- ✅ Voice booking records

### **Admin Device Shows:**
- ✅ All system statistics
- ✅ User management
- ✅ Hospital management
- ✅ Overall booking analytics

---

## 🌐 Cross-Device Synchronization

### **Real-time Updates:**
- **Firebase**: Cloud sync across all devices
- **LocalStorage**: Browser-based instant updates
- **Polling**: Every 2 seconds for new data

### **Data Consistency:**
- **Requests**: Instantly appear on hospital devices
- **Status Updates**: Real-time status changes
- **Bed Availability**: Live bed count updates
- **User Sessions**: Persistent across device refreshes

---

## 🔧 Technical Implementation

### **Firebase Integration:**
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
```

### **LocalStorage Integration:**
```javascript
// Shared store for all portals
export function getRequests() {
  return JSON.parse(localStorage.getItem('bookingRequests') || '[]');
}

export function addRequest(booking) {
  localStorage.setItem('bookingRequests', JSON.stringify([...requests, booking]));
}
```

---

## 📋 Data Examples

### **Request Data Structure:**
```javascript
{
  "bookingId": "REQ123456789",
  "hospitalId": "H001",
  "hospitalName": "KMC Hospital",
  "driverId": "D001",
  "driverName": "Raj Kumar",
  "patientName": "John Doe",
  "patientAge": "45",
  "patientPhone": "9876543210",
  "emergencyType": "emergency",
  "bedType": "icu",
  "status": "pending",
  "bookedAt": "2025-05-05T10:30:00.000Z"
}
```

### **Hospital Data Structure:**
```javascript
{
  "id": "H001",
  "name": "KMC Hospital",
  "location": "Srirangam, Trichy",
  "bedsAvailable": 50,
  "bedTypes": {
    "icu": 10,
    "emergency": 20,
    "general": 15,
    "private": 5,
    "deluxe": 0
  }
}
```

---

## 🚀 Deployment Notes

### **Production Database:**
- **Firebase**: Production Firestore database
- **Real-time**: Live data synchronization
- **Scalable**: Handles multiple concurrent users

### **Development Database:**
- **LocalStorage**: Browser-based for development
- **Mock Data**: Sample hospitals and requests
- **Instant**: No network latency

---

## 📊 Current Database Status

✅ **Firebase**: Configured and ready  
✅ **LocalStorage**: Working for real-time sync  
✅ **Cross-device**: Data sharing implemented  
✅ **Real-time**: 2-second polling interval  
✅ **Persistent**: Data survives page refreshes  

**Your system uses both Firebase (cloud) and LocalStorage (browser) for complete data synchronization across all devices!**
