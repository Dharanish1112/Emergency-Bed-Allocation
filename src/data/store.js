/**
 * Shared localStorage store — single source of truth for all 3 portals.
 *
 * Keys:
 *   bookingRequests  – array of booking objects written by driver
 *   hospitalBeds     – { [hospitalId]: { icu, emergency, general } } written by hospital
 *   requestStatuses  – { [bookingId]: 'pending'|'accepted'|'rejected' } written by hospital
 */

const KEYS = {
  requests: 'bookingRequests',
  beds:     'hospitalBeds',
  statuses: 'requestStatuses',
};

// ── helpers ──────────────────────────────────────────────────
function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Booking Requests (written by Driver) ─────────────────────
export function getRequests() {
  return read(KEYS.requests) || [];
}

export function addRequest(booking) {
  const list = getRequests();
  // avoid duplicates
  if (list.find(r => r.bookingId === booking.bookingId)) return;
  const req = {
    bookingId:     booking.bookingId,
    hospitalId:    booking.hospital.id,
    hospitalName:  booking.hospital.name,
    driverId:      booking.driver?.id || '',
    driverName:    booking.driver?.name || '',
    patientName:   booking.patientName,
    patientAge:    booking.patientAge,
    patientPhone:  booking.patientPhone,
    emergencyType: booking.emergencyType,
    bedType:       booking.bedType,
    notes:         booking.notes || '',
    eta:           booking.hospital.eta,
    distance:      booking.hospital.distance,
    bookedAt:      new Date().toISOString(),
    status:        'pending',
    isNew:         true,
  };
  write(KEYS.requests, [req, ...list]);
}

export function getRequestsForHospital(hospitalId) {
  return getRequests().filter(r => r.hospitalId === hospitalId);
}

// ── Request Statuses (written by Hospital) ───────────────────
export function getStatuses() {
  return read(KEYS.statuses) || {};
}

export function setRequestStatus(bookingId, status) {
  // update in requests array
  const list = getRequests().map(r =>
    r.bookingId === bookingId ? { ...r, status, isNew: false } : r
  );
  write(KEYS.requests, list);
  // also write to statuses map for quick lookup
  const statuses = getStatuses();
  write(KEYS.statuses, { ...statuses, [bookingId]: status });
}

export function getStatusForBooking(bookingId) {
  return getStatuses()[bookingId] || 'pending';
}

// ── Hospital Beds (written by Hospital) ──────────────────────
export function getAllBeds() {
  return read(KEYS.beds) || {};
}

export function getBedsForHospital(hospitalId) {
  const all = getAllBeds();
  return all[hospitalId] || null; // null = not yet overridden, use dummy data
}

export function setBedsForHospital(hospitalId, beds) {
  const all = getAllBeds();
  write(KEYS.beds, { ...all, [hospitalId]: beds });
}

// ── Admin stats helpers ───────────────────────────────────────
export function getLiveStats() {
  const reqs = getRequests();
  return {
    totalBookings: reqs.length,
    pending:       reqs.filter(r => r.status === 'pending').length,
    accepted:      reqs.filter(r => r.status === 'accepted').length,
    rejected:      reqs.filter(r => r.status === 'rejected').length,
  };
}
