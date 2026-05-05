// ── Hospital images pool (varied, realistic hospital photos) ──
const IMAGES = [
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=280&fit=crop',
];

// ── City coordinates (Tamil Nadu) — exported for use in pages ─
export const CITY_COORDS = {
  Chennai:     { lat: 13.0827, lng: 80.2707 },
  Coimbatore:  { lat: 11.0168, lng: 76.9558 },
  Madurai:     { lat: 9.9252,  lng: 78.1198 },
  Salem:       { lat: 11.6643, lng: 78.1460 },
  Trichy:      { lat: 10.7905, lng: 78.7047 },
  Tirunelveli: { lat: 8.7139,  lng: 77.7567 },
  Erode:       { lat: 11.3410, lng: 77.7172 },
  Vellore:     { lat: 12.9165, lng: 79.1325 },
  Thanjavur:   { lat: 10.7870, lng: 79.1378 },
  Nagercoil:   { lat: 8.1833,  lng: 77.4119 },
};

// ── Speciality map by hospital name prefix ────────────────────
function getSpeciality(name) {
  if (name.includes('Apollo'))      return 'Multi-Specialty';
  if (name.includes('Global'))      return 'General Medicine';
  if (name.includes('Unity'))       return 'Trauma & Emergency';
  if (name.includes('MedPlus'))     return 'Cardiac Care';
  if (name.includes('Metro'))       return 'Neurology';
  if (name.includes('LifeLine'))    return 'Critical Care';
  if (name.includes('Sunrise'))     return 'Orthopaedics';
  if (name.includes('Royal'))       return 'Oncology';
  if (name.includes('Prime Care'))  return 'Obstetrics & Gynaecology';
  if (name.includes('City Care'))   return 'Paediatrics';
  return 'General Hospital';
}

// ── Deterministic bed counts (seeded by hospital index) ───────
function getBeds(idx) {
  const seed = (idx * 7 + 3) % 10;
  const patterns = [
    { icu: 4, emergency: 10, general: 30 },
    { icu: 2, emergency: 6,  general: 20 },
    { icu: 0, emergency: 3,  general: 15 },
    { icu: 5, emergency: 12, general: 40 },
    { icu: 1, emergency: 4,  general: 18 },
    { icu: 3, emergency: 8,  general: 25 },
    { icu: 0, emergency: 0,  general: 5  },
    { icu: 6, emergency: 14, general: 45 },
    { icu: 2, emergency: 5,  general: 22 },
    { icu: 0, emergency: 2,  general: 12 },
  ];
  return patterns[seed];
}

function getStatus(beds) {
  const total = beds.icu + beds.emergency + beds.general;
  if (total === 0) return 'full';
  if (beds.icu === 0 && beds.emergency <= 2) return 'critical';
  return 'available';
}

function getRating(idx) {
  const ratings = [4.8, 4.6, 4.9, 4.5, 4.7, 4.6, 4.4, 4.8, 4.5, 4.7];
  return ratings[idx % ratings.length];
}

function getDistance(idx) {
  const d = ((idx * 1.3 + 0.8) % 15 + 0.5).toFixed(1);
  return `${d} km`;
}

function getEta(idx) {
  const mins = Math.round((idx * 1.3 + 0.8) % 15 + 3);
  return `${mins} min`;
}

function getCoords(city, idx) {
  const base = CITY_COORDS[city] || CITY_COORDS.Chennai;
  // slight offset per hospital so pins don't stack
  return {
    lat: base.lat + (idx % 5) * 0.008 - 0.016,
    lng: base.lng + (idx % 7) * 0.007 - 0.021,
  };
}

// ── Raw Excel data (hospital.xlsx) ───────────────────────────
const EXCEL_HOSPITALS = [
  { id: 'H201', name: 'Global Hospital 1',       location: 'Vellore' },
  { id: 'H202', name: 'Unity Hospital 2',        location: 'Chennai' },
  { id: 'H203', name: 'MedPlus Hospital 3',      location: 'Thanjavur' },
  { id: 'H204', name: 'Global Hospital 4',       location: 'Erode' },
  { id: 'H205', name: 'Apollo Hospital 5',       location: 'Tirunelveli' },
  { id: 'H206', name: 'Metro Hospital 6',        location: 'Tirunelveli' },
  { id: 'H207', name: 'LifeLine Hospital 7',     location: 'Thanjavur' },
  { id: 'H208', name: 'MedPlus Hospital 8',      location: 'Chennai' },
  { id: 'H209', name: 'Sunrise Hospital 9',      location: 'Erode' },
  { id: 'H210', name: 'Royal Hospital 10',       location: 'Trichy' },
  { id: 'H211', name: 'Sunrise Hospital 11',     location: 'Vellore' },
  { id: 'H212', name: 'LifeLine Hospital 12',    location: 'Salem' },
  { id: 'H213', name: 'LifeLine Hospital 13',    location: 'Vellore' },
  { id: 'H214', name: 'LifeLine Hospital 14',    location: 'Nagercoil' },
  { id: 'H215', name: 'Prime Care Hospital 15',  location: 'Salem' },
  { id: 'H216', name: 'Sunrise Hospital 16',     location: 'Madurai' },
  { id: 'H217', name: 'City Care Hospital 17',   location: 'Madurai' },
  { id: 'H218', name: 'Apollo Hospital 18',      location: 'Madurai' },
  { id: 'H219', name: 'Prime Care Hospital 19',  location: 'Erode' },
  { id: 'H220', name: 'MedPlus Hospital 20',     location: 'Salem' },
  { id: 'H221', name: 'LifeLine Hospital 21',    location: 'Thanjavur' },
  { id: 'H222', name: 'City Care Hospital 22',   location: 'Salem' },
  { id: 'H223', name: 'Metro Hospital 23',       location: 'Madurai' },
  { id: 'H224', name: 'Royal Hospital 24',       location: 'Thanjavur' },
  { id: 'H225', name: 'Metro Hospital 25',       location: 'Madurai' },
  { id: 'H226', name: 'MedPlus Hospital 26',     location: 'Salem' },
  { id: 'H227', name: 'Apollo Hospital 27',      location: 'Nagercoil' },
  { id: 'H228', name: 'MedPlus Hospital 28',     location: 'Salem' },
  { id: 'H229', name: 'Prime Care Hospital 29',  location: 'Vellore' },
  { id: 'H230', name: 'Prime Care Hospital 30',  location: 'Madurai' },
  { id: 'H231', name: 'Prime Care Hospital 31',  location: 'Trichy' },
  { id: 'H232', name: 'Royal Hospital 32',       location: 'Erode' },
  { id: 'H233', name: 'Royal Hospital 33',       location: 'Nagercoil' },
  { id: 'H234', name: 'Sunrise Hospital 34',     location: 'Nagercoil' },
  { id: 'H235', name: 'Apollo Hospital 35',      location: 'Tirunelveli' },
  { id: 'H236', name: 'Metro Hospital 36',       location: 'Thanjavur' },
  { id: 'H237', name: 'Apollo Hospital 37',      location: 'Madurai' },
  { id: 'H238', name: 'Unity Hospital 38',       location: 'Tirunelveli' },
  { id: 'H239', name: 'Global Hospital 39',      location: 'Nagercoil' },
  { id: 'H240', name: 'LifeLine Hospital 40',    location: 'Trichy' },
  { id: 'H241', name: 'Sunrise Hospital 41',     location: 'Coimbatore' },
  { id: 'H242', name: 'Apollo Hospital 42',      location: 'Salem' },
  { id: 'H243', name: 'Prime Care Hospital 43',  location: 'Tirunelveli' },
  { id: 'H244', name: 'Metro Hospital 44',       location: 'Thanjavur' },
  { id: 'H245', name: 'Global Hospital 45',      location: 'Erode' },
  { id: 'H246', name: 'Royal Hospital 46',       location: 'Chennai' },
  { id: 'H247', name: 'Global Hospital 47',      location: 'Trichy' },
  { id: 'H248', name: 'Royal Hospital 48',       location: 'Nagercoil' },
  { id: 'H249', name: 'MedPlus Hospital 49',     location: 'Salem' },
  { id: 'H250', name: 'Prime Care Hospital 50',  location: 'Erode' },
];

// ── Build full hospital objects ───────────────────────────────
export const hospitals = EXCEL_HOSPITALS.map((h, idx) => {
  const beds = getBeds(idx);
  return {
    id:          h.id,           // 'H201' etc — matches login user id
    numericId:   idx + 1,        // for display serial number
    name:        h.name,
    image:       IMAGES[idx % IMAGES.length],
    distance:    getDistance(idx),
    eta:         getEta(idx),
    address:     h.location + ', Tamil Nadu',
    city:        h.location,
    beds,
    status:      getStatus(beds),
    rating:      getRating(idx),
    speciality:  getSpeciality(h.name),
    coordinates: getCoords(h.location, idx),
  };
});

// ── Helper: get hospitals for a specific city ─────────────────
export function getHospitalsByCity(city) {
  return hospitals.filter(h => h.city === city);
}

// ── Helper: get hospital by login ID ─────────────────────────
export function getHospitalById(id) {
  return hospitals.find(h => h.id === id) || null;
}

// ── Emergency types ───────────────────────────────────────────
export const emergencyTypes = [
  'Cardiac Arrest',
  'Trauma / Accident',
  'Stroke',
  'Respiratory Failure',
  'Severe Burns',
  'Obstetric Emergency',
  'Poisoning',
  'Neurological Emergency',
];

// ── Seed incoming requests — empty, only real driver bookings show ──
export const incomingRequests = [];

// ── Admin stats ───────────────────────────────────────────────
export const adminStats = {
  totalHospitals: hospitals.length,
  totalBookings:  1284,
  successRate:    94.2,
  peakTime:       '10:00 AM - 2:00 PM',
  todayBookings:  37,
  criticalCases:  hospitals.filter(h => h.status === 'critical').length,
};

// ── Admin hospital table (all 50 from Excel) ──────────────────
export const adminHospitals = hospitals.map(h => ({
  id:       h.id,
  name:     h.name,
  location: h.city,
  beds:     h.beds.icu + h.beds.emergency + h.beds.general,
  status:   h.status === 'full' ? 'maintenance' : 'active',
  bookings: Math.floor(Math.random() * 300 + 50),
}));
