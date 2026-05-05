import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, MapPin, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const VoiceBooking = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('Trichy');
  const [bedType, setBedType] = useState('');
  const [bookingStep, setBookingStep] = useState('initial'); // initial, hospital, bedtype, confirm
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Load hospital data from Excel file and filter by driver location
  useEffect(() => {
    loadHospitalsFromExcel();
    getDriverLocation();
  }, []);

  const getDriverLocation = () => {
    // Get driver location from localStorage (set during login)
    const userData = JSON.parse(localStorage.getItem('simpleExcelUser') || '{}');
    const driverLocation = userData.location || 'Trichy';
    setCurrentLocation(driverLocation);
  };

  const loadHospitalsFromExcel = async () => {
    try {
      // First try to read from hospital.csv (easier to work with)
      let hospitalData = [];
      
      try {
        const csvResponse = await fetch('/hospital.csv');
        const csvText = await csvResponse.text();
        const workbook = XLSX.read(csvText, { type: 'string' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        hospitalData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Loaded from CSV file');
      } catch (csvError) {
        // Try Excel file if CSV fails
        try {
          const excelResponse = await fetch('/hospital.xlsx');
          const arrayBuffer = await excelResponse.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          hospitalData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Loaded from Excel file');
        } catch (excelError) {
          throw new Error('Neither CSV nor Excel file found');
        }
      }
      
      // Convert Excel data to hospital format
      const formattedHospitalData = hospitalData.map(row => ({
        id: row['ID'] || row['id'] || '',
        name: row['Hospital Name'] || row['name'] || '',
        location: row['Location'] || row['location'] || '',
        bedsAvailable: parseInt(row['Total Beds'] || row['bedsAvailable']) || 0,
        phone: row['Phone'] || row['phone'] || '',
        bedTypes: {
          icu: parseInt(row['ICU Beds'] || row['icu']) || 0,
          emergency: parseInt(row['Emergency Beds'] || row['emergency']) || 0,
          general: parseInt(row['General Beds'] || row['general']) || 0,
          private: parseInt(row['Private Rooms'] || row['private']) || 0,
          deluxe: parseInt(row['Deluxe Rooms'] || row['deluxe']) || 0
        }
      }));
      
      // Filter hospitals by driver location
      const userData = JSON.parse(localStorage.getItem('simpleExcelUser') || '{}');
      const driverLocation = userData.location || 'Trichy';
      setCurrentLocation(driverLocation);
      
      // Get unique locations from Excel for dropdown
      const uniqueLocations = [...new Set(formattedHospitalData.map(h => h.location))];
      console.log('Available locations from Excel:', uniqueLocations);
      
      const locationFilteredHospitals = formattedHospitalData.filter(hospital => 
        hospital.location.toLowerCase().includes(driverLocation.toLowerCase())
      );
      
      console.log('Driver location:', driverLocation);
      console.log('All hospitals from Excel:', formattedHospitalData);
      console.log('Filtered hospitals:', locationFilteredHospitals);
      setHospitals(locationFilteredHospitals);
      
    } catch (error) {
      console.error('Error loading Excel data:', error);
      // Fallback to mock data if Excel file not found
      const fallbackData = [
        { id: 'H001', name: 'KMC Hospital', location: 'Srirangam, Trichy', bedsAvailable: 50, phone: '9876543212', bedTypes: { icu: 10, emergency: 20, general: 15, private: 5, deluxe: 0 } },
        { id: 'H002', name: 'Apollo Hospital', location: 'Woraiyur, Trichy', bedsAvailable: 30, phone: '9876543213', bedTypes: { icu: 8, emergency: 12, general: 10, private: 0, deluxe: 0 } },
        { id: 'H003', name: 'Govt Hospital', location: 'Trichy', bedsAvailable: 40, phone: '9876543214', bedTypes: { icu: 15, emergency: 15, general: 10, private: 0, deluxe: 0 } }
      ];
      
      const userData = JSON.parse(localStorage.getItem('simpleExcelUser') || '{}');
      const driverLocation = userData.location || 'Trichy';
      setCurrentLocation(driverLocation);
      
      const locationFilteredHospitals = fallbackData.filter(hospital => 
        hospital.location.toLowerCase().includes(driverLocation.toLowerCase())
      );
      
      setHospitals(locationFilteredHospitals);
      speak('Using fallback data. Please upload your hospital.xlsx file to the public folder.');
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast.error('Speech recognition not supported in your browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [hospitals]);

  // Text-to-speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      synthRef.current.speak(utterance);
    }
  };

  // Process voice commands
  const processVoiceCommand = (command) => {
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();

    // Check for location commands
    if (lowerCommand.includes('location') || lowerCommand.includes('show hospitals') || lowerCommand.includes('nearby')) {
      extractLocation(lowerCommand);
    }
    // Check for booking commands
    else if (lowerCommand.includes('book') || lowerCommand.includes('reserve') || lowerCommand.includes('need bed')) {
      extractBookingInfo(lowerCommand);
    } 
    // Check for hospital information
    else if (lowerCommand.includes('hospital') || lowerCommand.includes('available')) {
      provideHospitalInfo(lowerCommand);
    }
    // Check for help
    else if (lowerCommand.includes('help') || lowerCommand.includes('what can')) {
      provideHelp();
    }
    else {
      speak('I can help you book hospital beds. Say "show hospitals in Trichy" or "book a bed at KMC Hospital"');
      setConfirmation('Try saying: "show hospitals in location" or "book a bed at hospital name"');
    }

    setTimeout(() => setIsProcessing(false), 2000);
  };

  // Extract location from voice command
  const extractLocation = (command) => {
    let locationFound = 'Trichy'; // default
    
    if (command.includes('chennai')) {
      locationFound = 'Chennai';
    } else if (command.includes('trichy')) {
      locationFound = 'Trichy';
    } else if (command.includes('bangalore')) {
      locationFound = 'Bangalore';
    } else if (command.includes('coimbatore')) {
      locationFound = 'Coimbatore';
    }

    setCurrentLocation(locationFound);
    
    const locationHospitals = hospitals.filter(h => h.location.includes(locationFound));
    
    const info = `Found ${locationHospitals.length} hospitals in ${locationFound}: ${locationHospitals.map(h => h.name).join(', ')}`;
    speak(info);
    setConfirmation(info);
    setBookingStep('hospital');
  };

  // Extract booking information from voice command
  const extractBookingInfo = (command) => {
    let hospitalFound = null;
    let patientName = '';
    let urgency = 'normal';
    let bedTypeFound = '';

    // Find hospital
    hospitals.forEach(hospital => {
      if (command.includes(hospital.name.toLowerCase()) || 
          command.includes(hospital.id.toLowerCase())) {
        hospitalFound = hospital;
      }
    });

    // Extract patient name
    const namePatterns = [
      /for\s+(\w+\s+\w+)/i,
      /patient\s+(\w+\s+\w+)/i,
      /name\s+is\s+(\w+\s+\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = command.match(pattern);
      if (match) {
        patientName = match[1];
        break;
      }
    }

    // Extract bed type
    if (command.includes('icu bed') || command.includes('intensive care')) {
      bedTypeFound = 'icu';
    } else if (command.includes('emergency bed') || command.includes('emergency')) {
      bedTypeFound = 'emergency';
    } else if (command.includes('general bed') || command.includes('normal bed') || command.includes('regular bed')) {
      bedTypeFound = 'general';
    } else if (command.includes('private room') || command.includes('private bed')) {
      bedTypeFound = 'private';
    } else if (command.includes('deluxe room') || command.includes('deluxe bed')) {
      bedTypeFound = 'deluxe';
    }

    // Check urgency
    if (command.includes('emergency') || command.includes('urgent') || command.includes('critical')) {
      urgency = 'emergency';
    }

    if (hospitalFound) {
      // Check if bed type is available
      const availableBeds = hospitalFound.bedTypes[bedTypeFound] || hospitalFound.bedTypes.general;
      
      if (availableBeds <= 0) {
        speak(`Sorry, ${bedTypeFound} beds are not available at ${hospitalFound.name}. Available beds: ICU: ${hospitalFound.bedTypes.icu}, Emergency: ${hospitalFound.bedTypes.emergency}, General: ${hospitalFound.bedTypes.general}, Private: ${hospitalFound.bedTypes.private}, Deluxe: ${hospitalFound.bedTypes.deluxe}`);
        setConfirmation(`${bedTypeFound} beds not available. Please choose another bed type.`);
        return;
      }

      const booking = {
        hospital: hospitalFound,
        patientName: patientName || 'Unknown Patient',
        bedType: bedTypeFound || 'general',
        urgency: urgency,
        timestamp: new Date(),
        bookingId: 'BK' + Date.now()
      };

      setBookingData(booking);
      setSelectedHospital(hospitalFound);
      setBedType(bedTypeFound || 'general');
      setBookingStep('confirm');
      
      // Save booking to localStorage for hospital page sync
      saveBookingToLocalStorage(booking);
      
      const confirmationText = `Booking confirmed at ${hospitalFound.name} for ${booking.patientName}. ${bedTypeFound || 'general'} bed booked. ${availableBeds} beds available. Booking ID: ${booking.bookingId}`;
      speak(confirmationText);
      setConfirmation(confirmationText);
      
      toast.success(`Voice booking successful! ${confirmationText}`);
    } else {
      speak('Please specify a hospital. Available hospitals: ' + hospitals.map(h => h.name).join(', '));
      setConfirmation('Please specify a hospital name');
    }
  };

  // Provide hospital information
  const provideHospitalInfo = (command) => {
    let info = 'Available hospitals: ';
    
    hospitals.forEach((hospital, index) => {
      info += `${hospital.name} has ${hospital.bedsAvailable} beds available`;
      if (index < hospitals.length - 1) info += ', ';
    });

    speak(info);
    setConfirmation(info);
  };

  // Save booking to localStorage for hospital page sync
  const saveBookingToLocalStorage = (booking) => {
    try {
      // Get existing bookings
      const existingBookings = JSON.parse(localStorage.getItem('voiceBookings') || '[]');
      
      // Add new booking
      existingBookings.push({
        ...booking,
        source: 'voice',
        createdAt: new Date().toISOString()
      });
      
      // Save to localStorage
      localStorage.setItem('voiceBookings', JSON.stringify(existingBookings));
      
      // Also save as latest booking for easy access
      localStorage.setItem('latestVoiceBooking', JSON.stringify(booking));
      
      console.log('Voice booking saved:', booking);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  // Provide help information
  const provideHelp = () => {
    const helpText = `I can help you book hospital beds. Try saying: "show hospitals in ${currentLocation}", "book an ICU bed at KMC Hospital", "show hospitals in Chennai", or "change location to Coimbatore"`;
    speak(helpText);
    setConfirmation(helpText);
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setConfirmation('');
      speak('Listening... Please tell me what you need');
    }
  };

  // Manual booking confirmation
  const confirmBooking = () => {
    if (bookingData) {
      const confirmationText = `Booking confirmed! ${bookingData.patientName} booked at ${bookingData.hospital.name}. Booking ID: ${bookingData.bookingId}`;
      speak(confirmationText);
      toast.success(confirmationText);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Phone size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Voice Bed Booking</h1>
                <p className="text-gray-600">Book hospital beds using voice commands</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={20} className="text-gray-600" />
              <span className="text-sm text-gray-600">Voice Enabled</span>
            </div>
          </div>
        </div>

        {/* Voice Control Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Assistant</h2>
            
            {/* Microphone Button */}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white shadow-lg`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">
                {isListening ? 'Listening...' : 'Tap to start voice booking'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {isProcessing ? 'Processing your request...' : 'Say "book a bed at hospital name"'}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">You said:</p>
                <p className="text-lg font-medium text-gray-900">{transcript}</p>
              </div>
            )}

            {/* Confirmation Display */}
            {confirmation && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Volume2 size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-blue-600">Assistant Response:</p>
                    <p className="text-gray-900">{confirmation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hospitals in {currentLocation}</h3>
            <div className="flex items-center gap-2">
              <select
                value={currentLocation}
                onChange={(e) => {
                  const newLocation = e.target.value;
                  setCurrentLocation(newLocation);
                  
                  // Filter hospitals by new location
                  const userData = JSON.parse(localStorage.getItem('simpleExcelUser') || '{}');
                  userData.location = newLocation;
                  localStorage.setItem('simpleExcelUser', JSON.stringify(userData));
                  
                  // Re-filter hospitals
                  const mockExcelData = [
                    // Trichy Hospitals
                    { id: 'H001', name: 'KMC Hospital', location: 'Srirangam, Trichy', bedsAvailable: 50, phone: '9876543212' },
                    { id: 'H002', name: 'Apollo Hospital', location: 'Woraiyur, Trichy', bedsAvailable: 30, phone: '9876543213' },
                    { id: 'H003', name: 'Govt Hospital', location: 'Trichy', bedsAvailable: 40, phone: '9876543214' },
                    
                    // Chennai Hospitals
                    { id: 'H004', name: 'SRM Hospital', location: 'Chennai', bedsAvailable: 60, phone: '9876543215' },
                    { id: 'H005', name: 'Apollo Chennai', location: 'Chennai', bedsAvailable: 45, phone: '9876543216' },
                    
                    // Coimbatore Hospitals
                    { id: 'H007', name: 'PSG Hospital', location: 'Coimbatore', bedsAvailable: 35, phone: '9876543218' },
                    { id: 'H008', name: 'KMCH Hospital', location: 'Coimbatore', bedsAvailable: 40, phone: '9876543219' }
                  ];
                  
                  const locationFilteredHospitals = mockExcelData.filter(hospital => 
                    hospital.location.toLowerCase().includes(newLocation.toLowerCase())
                  );
                  
                  setHospitals(locationFilteredHospitals);
                  speak(`Location changed to ${newLocation}. Found ${locationFilteredHospitals.length} hospitals.`);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Trichy">Trichy</option>
                <option value="Chennai">Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Bangalore">Bangalore</option>
              </select>
              
              <MapPin size={16} className="text-gray-600" />
              <span className="text-sm text-gray-600">{currentLocation}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.filter(h => h.location.includes(currentLocation)).map(hospital => (
              <div key={hospital.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    hospital.bedsAvailable > 20 ? 'bg-green-100 text-green-800' : 
                    hospital.bedsAvailable > 10 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {hospital.bedsAvailable} beds
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{hospital.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    <span>{hospital.phone}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Available Bed Types:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-red-600">ICU: {hospital.bedTypes.icu}</span>
                      <span className="text-orange-600">Emergency: {hospital.bedTypes.emergency}</span>
                      <span className="text-blue-600">General: {hospital.bedTypes.general}</span>
                      <span className="text-purple-600">Private: {hospital.bedTypes.private}</span>
                      <span className="text-green-600">Deluxe: {hospital.bedTypes.deluxe}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hospitals.filter(h => h.location.includes(currentLocation)).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hospitals found in {currentLocation}</p>
            </div>
          )}
        </div>

        {/* Booking Details */}
        {bookingData && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <CheckCircle size={20} className="text-green-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Hospital</p>
                  <p className="font-medium text-gray-900">{bookingData.hospital.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-medium text-gray-900">{bookingData.patientName}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-medium text-gray-900">{bookingData.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgency</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    bookingData.urgency === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {bookingData.urgency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmBooking}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => speak(`Booking details: ${bookingData.patientName} at ${bookingData.hospital.name}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <Volume2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Commands</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Show hospitals in Trichy"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Show hospitals in Chennai"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Book an ICU bed at KMC Hospital"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Book a private room at Apollo Hospital"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Emergency booking at Govt Hospital"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Book a general bed for patient John"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Book a deluxe room at SRM Hospital"</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">Available Bed Types:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div>• ICU Bed - Intensive Care Unit</div>
              <div>• Emergency Bed - Emergency Ward</div>
              <div>• General Bed - General Ward</div>
              <div>• Private Room - Private Accommodation</div>
              <div>• Deluxe Room - Premium Accommodation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceBooking;
