import React, { useState } from 'react';
import { Phone, MapPin, User, Clock, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { addRequest } from '../data/store';

const CreateRequest = ({ driver, hospitals, onRequestCreated }) => {
  const [formData, setFormData] = useState({
    hospitalId: '',
    patientName: '',
    patientAge: '',
    patientPhone: '',
    emergencyType: 'normal',
    bedType: 'general',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.hospitalId) {
      toast.error('Please select a hospital');
      return;
    }

    if (!formData.patientName || !formData.patientPhone) {
      toast.error('Please fill patient details');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedHospital = hospitals.find(h => h.id === formData.hospitalId);
      
      const booking = {
        bookingId: 'REQ' + Date.now(),
        hospital: selectedHospital,
        driver: driver,
        patientName: formData.patientName,
        patientAge: formData.patientAge,
        patientPhone: formData.patientPhone,
        emergencyType: formData.emergencyType,
        bedType: formData.bedType,
        notes: formData.notes
      };

      addRequest(booking);
      toast.success('Request sent to hospital successfully!');
      
      // Reset form
      setFormData({
        hospitalId: '',
        patientName: '',
        patientAge: '',
        patientPhone: '',
        emergencyType: 'normal',
        bedType: 'general',
        notes: ''
      });

      if (onRequestCreated) {
        onRequestCreated(booking);
      }

    } catch (error) {
      toast.error('Failed to send request');
      console.error('Request error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Send size={16} className="text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Send Request to Hospital</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hospital Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Hospital
            </label>
            <select
              value={formData.hospitalId}
              onChange={(e) => setFormData({...formData, hospitalId: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose Hospital...</option>
              {hospitals.map(hospital => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name} - {hospital.location}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({...formData, patientName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient name"
              required
            />
          </div>

          {/* Patient Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Age
            </label>
            <input
              type="number"
              value={formData.patientAge}
              onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient age"
              min="1"
              max="120"
            />
          </div>

          {/* Patient Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Phone
            </label>
            <input
              type="tel"
              value={formData.patientPhone}
              onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient phone number"
              required
            />
          </div>

          {/* Emergency Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type
            </label>
            <select
              value={formData.emergencyType}
              onChange={(e) => setFormData({...formData, emergencyType: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="emergency">Emergency</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Bed Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bed Type Required
            </label>
            <select
              value={formData.bedType}
              onChange={(e) => setFormData({...formData, bedType: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">General Bed</option>
              <option value="icu">ICU Bed</option>
              <option value="emergency">Emergency Bed</option>
              <option value="private">Private Room</option>
              <option value="deluxe">Deluxe Room</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Any additional information..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Request...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Request to Hospital
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
