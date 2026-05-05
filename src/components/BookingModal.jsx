import { useState } from 'react';
import {
  X, User, Phone as PhoneIcon, AlertTriangle, Bed, MapPin, Clock,
  CheckCircle, FileText, Calendar, Hash,
  ChevronRight, Printer, Share2
} from 'lucide-react';
import { addRequest } from '../data/store';

const EMERGENCY_TYPES = [
  'Cardiac Arrest',
  'Trauma / Accident',
  'Stroke',
  'Respiratory Failure',
  'Severe Burns',
  'Obstetric Emergency',
  'Poisoning',
  'Neurological Emergency',
  'Fracture / Ortho',
  'Other',
];

const BED_TYPES = [
  { key: 'icu',       label: 'ICU',          desc: 'Intensive Care Unit',  color: 'red' },
  { key: 'emergency', label: 'Emergency',    desc: 'Emergency Ward',       color: 'orange' },
  { key: 'general',   label: 'General Ward', desc: 'General Ward',         color: 'blue' },
];

const COLOR = {
  red:    { ring: 'ring-red-400',    bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
  orange: { ring: 'ring-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  blue:   { ring: 'ring-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
};

function generateBookingId() {
  return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export default function BookingModal({ hospital, driver, onClose, onConfirmed }) {
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'
  const [booking, setBooking] = useState(null);

  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientPhone: '',
    emergencyType: '',
    bedType: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  if (!hospital) return null;

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.patientName.trim()) e.patientName = 'Patient name is required';
    if (!form.patientAge || form.patientAge < 1 || form.patientAge > 120) e.patientAge = 'Enter a valid age';
    if (!form.patientPhone.trim() || !/^\d{10}$/.test(form.patientPhone.trim())) e.patientPhone = 'Enter a valid 10-digit phone number';
    if (!form.emergencyType) e.emergencyType = 'Select emergency type';
    if (!form.bedType) e.bedType = 'Select bed type';
    else if (hospital.beds[form.bedType] === 0) e.bedType = 'No beds available for this type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (validate()) setStep('confirm');
  };

  const handleConfirm = () => {
    const b = {
      bookingId: generateBookingId(),
      bookedAt: new Date(),
      hospital,
      driver,
      ...form,
    };
    setBooking(b);
    setStep('success');
    // ── Write to shared store so Hospital page picks it up ──
    addRequest(b);
    onConfirmed && onConfirmed(b);
  };

  const selectedBedMeta = BED_TYPES.find(b => b.key === form.bedType);

  // ── STEP: FORM ───────────────────────────────────────────────
  if (step === 'form') {
    return (
      <Overlay onClose={onClose}>
        {/* Header */}
        <ModalHeader
          title="Book Emergency Bed"
          subtitle={hospital.name}
          onClose={onClose}
          icon={<Bed size={20} className="text-blue-600" />}
        />

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Hospital Summary */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl mb-6">
            <img src={hospital.image} alt={hospital.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{hospital.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{hospital.speciality}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                <span className="flex items-center gap-1"><MapPin size={11} />{hospital.distance}</span>
                <span className="flex items-center gap-1"><Clock size={11} />ETA {hospital.eta}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">Rating</p>
              <p className="font-bold text-gray-800">★ {hospital.rating}</p>
            </div>
          </div>

          {/* Patient Details */}
          <Section title="Patient Details" icon={<User size={15} className="text-blue-600" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Patient Name *" error={errors.patientName}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.patientName}
                  onChange={e => { setForm(f => ({ ...f, patientName: e.target.value })); setErrors(er => ({ ...er, patientName: '' })); }}
                  className={inputCls(errors.patientName)}
                />
              </Field>
              <Field label="Age *" error={errors.patientAge}>
                <input
                  type="number"
                  placeholder="Age"
                  min={1} max={120}
                  value={form.patientAge}
                  onChange={e => { setForm(f => ({ ...f, patientAge: e.target.value })); setErrors(er => ({ ...er, patientAge: '' })); }}
                  className={inputCls(errors.patientAge)}
                />
              </Field>
              <Field label="Contact Number *" error={errors.patientPhone} className="sm:col-span-2">
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.patientPhone}
                  onChange={e => { setForm(f => ({ ...f, patientPhone: e.target.value })); setErrors(er => ({ ...er, patientPhone: '' })); }}
                  className={inputCls(errors.patientPhone)}
                />
              </Field>
            </div>
          </Section>

          {/* Emergency Type */}
          <Section title="Emergency Type *" icon={<AlertTriangle size={15} className="text-red-500" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMERGENCY_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, emergencyType: type })); setErrors(er => ({ ...er, emergencyType: '' })); }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border
                    ${form.emergencyType === type
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.emergencyType && <p className="text-red-500 text-xs mt-1">{errors.emergencyType}</p>}
          </Section>

          {/* Bed Type */}
          <Section title="Bed Type *" icon={<Bed size={15} className="text-green-600" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BED_TYPES.map(bt => {
                const count = hospital.beds[bt.key];
                const unavailable = count === 0;
                const selected = form.bedType === bt.key;
                const c = COLOR[bt.color];
                return (
                  <button
                    key={bt.key}
                    type="button"
                    disabled={unavailable}
                    onClick={() => { setForm(f => ({ ...f, bedType: bt.key })); setErrors(er => ({ ...er, bedType: '' })); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${unavailable ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200' :
                        selected ? `${c.bg} ${c.ring} ring-2 border-transparent` :
                        'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.badge}`}>{bt.label}</span>
                      <span className={`text-sm font-bold ${unavailable ? 'text-gray-400' : 'text-gray-800'}`}>{count}</span>
                    </div>
                    <p className="text-xs text-gray-500">{bt.desc}</p>
                    <p className={`text-xs font-medium mt-1 ${unavailable ? 'text-red-400' : 'text-green-600'}`}>
                      {unavailable ? 'Not available' : `${count} bed${count !== 1 ? 's' : ''} free`}
                    </p>
                  </button>
                );
              })}
            </div>
            {errors.bedType && <p className="text-red-500 text-xs mt-1">{errors.bedType}</p>}
          </Section>

          {/* Additional Notes */}
          <Section title="Additional Notes" icon={<FileText size={15} className="text-gray-500" />}>
            <textarea
              rows={3}
              placeholder="Any additional information about the patient's condition..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
          >
            Review Booking
            <ChevronRight size={16} />
          </button>
        </div>
      </Overlay>
    );
  }

  // ── STEP: CONFIRM ────────────────────────────────────────────
  if (step === 'confirm') {
    const c = selectedBedMeta ? COLOR[selectedBedMeta.color] : COLOR.blue;
    return (
      <Overlay onClose={onClose}>
        <ModalHeader
          title="Confirm Booking"
          subtitle="Review details before confirming"
          onClose={onClose}
          icon={<CheckCircle size={20} className="text-green-600" />}
        />

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          {/* Hospital */}
          <ReviewCard title="Hospital" color="blue">
            <div className="flex items-center gap-3">
              <img src={hospital.image} alt={hospital.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-bold text-gray-900">{hospital.name}</p>
                <p className="text-xs text-gray-500">{hospital.speciality} · {hospital.address}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><MapPin size={10} />{hospital.distance}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />ETA {hospital.eta}</span>
                </div>
              </div>
            </div>
          </ReviewCard>

          {/* Patient */}
          <ReviewCard title="Patient Details" color="purple">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Name" value={form.patientName} />
              <Detail label="Age" value={`${form.patientAge} years`} />
              <Detail label="Phone" value={form.patientPhone} />
              <Detail label="Emergency" value={form.emergencyType} highlight />
            </div>
            {form.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{form.notes}</p>
              </div>
            )}
          </ReviewCard>

          {/* Bed */}
          <ReviewCard title="Bed Allocation" color="green">
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${c.badge}`}>
                  {selectedBedMeta?.label}
                </span>
                <p className="text-xs text-gray-500 mt-1">{selectedBedMeta?.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Available</p>
                <p className="text-xl font-bold text-green-600">{hospital.beds[form.bedType]}</p>
              </div>
            </div>
          </ReviewCard>

          {/* Driver */}
          {driver && (
            <ReviewCard title="Driver / Ambulance" color="orange">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Driver" value={driver.name} />
                <Detail label="Driver ID" value={driver.id} />
                <Detail label="Location" value={driver.location} />
              </div>
            </ReviewCard>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">
          <button onClick={() => setStep('form')} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
            ← Edit
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
          >
            <CheckCircle size={16} />
            Confirm Booking
          </button>
        </div>
      </Overlay>
    );
  }

  // ── STEP: SUCCESS ────────────────────────────────────────────
  if (step === 'success' && booking) {
    const c = selectedBedMeta ? COLOR[selectedBedMeta.color] : COLOR.blue;
    const bookedAt = booking.bookedAt;
    return (
      <Overlay onClose={onClose}>
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Success Banner */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center rounded-t-2xl">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
            <p className="text-green-100 text-sm">Emergency bed has been successfully reserved</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
              <Hash size={14} />
              <span className="font-mono font-bold tracking-wider text-sm">{booking.bookingId}</span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Time stamp */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl">
              <span className="flex items-center gap-1.5"><Calendar size={12} />Booked on</span>
              <span className="font-semibold text-gray-700">
                {bookedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                {bookedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Hospital */}
            <ConfirmCard title="Hospital Details" accent="blue">
              <div className="flex items-center gap-3 mb-3">
                <img src={hospital.image} alt={hospital.name} className="w-14 h-14 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{hospital.name}</p>
                  <p className="text-xs text-gray-500">{hospital.speciality}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={10} />{hospital.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Distance" value={hospital.distance} />
                <StatPill label="ETA" value={hospital.eta} />
                <StatPill label="Rating" value={`★ ${hospital.rating}`} />
              </div>
            </ConfirmCard>

            {/* Patient */}
            <ConfirmCard title="Patient Details" accent="purple">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Full Name" value={booking.patientName} />
                <Detail label="Age" value={`${booking.patientAge} years`} />
                <Detail label="Phone" value={booking.patientPhone} />
                <Detail label="Emergency Type" value={booking.emergencyType} highlight />
              </div>
              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Additional Notes</p>
                  <p className="text-sm text-gray-700">{booking.notes}</p>
                </div>
              )}
            </ConfirmCard>

            {/* Bed */}
            <ConfirmCard title="Bed Allocation" accent="green">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${c.badge}`}>
                    {selectedBedMeta?.label} — {selectedBedMeta?.desc}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">Bed reserved and held for 15 minutes</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Bed size={22} className="text-green-600" />
                </div>
              </div>
            </ConfirmCard>

            {/* Driver */}
            {driver && (
              <ConfirmCard title="Driver / Ambulance" accent="orange">
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Driver Name" value={driver.name} />
                  <Detail label="Driver ID" value={driver.id} />
                  <Detail label="Location" value={driver.location} />
                  <Detail label="Status" value="En Route" highlight />
                </div>
              </ConfirmCard>
            )}

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Emergency Contacts</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <PhoneIcon size={14} />
                  <span className="font-bold">108</span>
                  <span className="text-red-400">·</span>
                  <span>Ambulance Helpline</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <PhoneIcon size={14} />
                  <span className="font-bold">112</span>
                  <span className="text-red-400">·</span>
                  <span>Emergency</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Printer size={15} />
                Print
              </button>
              <button
                onClick={() => {
                  const text = `Booking ID: ${booking.bookingId}\nHospital: ${hospital.name}\nPatient: ${booking.patientName}\nBed: ${selectedBedMeta?.label}\nETA: ${hospital.eta}`;
                  navigator.clipboard?.writeText(text);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Share2 size={15} />
                Copy Details
              </button>
            </div>
          </div>
        </div>
      </Overlay>
    );
  }

  return null;
}

// ── Sub-components ───────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, icon }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <X size={18} className="text-gray-500" />
      </button>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputCls(error) {
  return `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
  }`;
}

function ReviewCard({ title, color, children }) {
  const accent = { blue: 'border-blue-200 bg-blue-50/40', purple: 'border-purple-200 bg-purple-50/40', green: 'border-green-200 bg-green-50/40', orange: 'border-orange-200 bg-orange-50/40' };
  const titleColor = { blue: 'text-blue-700', purple: 'text-purple-700', green: 'text-green-700', orange: 'text-orange-700' };
  return (
    <div className={`border rounded-2xl p-4 ${accent[color] || accent.blue}`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${titleColor[color] || titleColor.blue}`}>{title}</p>
      {children}
    </div>
  );
}

function ConfirmCard({ title, accent, children }) {
  const styles = {
    blue:   'border-blue-100',
    purple: 'border-purple-100',
    green:  'border-green-100',
    orange: 'border-orange-100',
  };
  const titleStyles = {
    blue:   'text-blue-700 bg-blue-50',
    purple: 'text-purple-700 bg-purple-50',
    green:  'text-green-700 bg-green-50',
    orange: 'text-orange-700 bg-orange-50',
  };
  return (
    <div className={`border rounded-2xl overflow-hidden ${styles[accent] || styles.blue}`}>
      <div className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide ${titleStyles[accent] || titleStyles.blue}`}>
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Detail({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2 text-center border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

