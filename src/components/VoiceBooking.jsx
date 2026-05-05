import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, MapPin, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceBooking = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Mock hospital data
  useEffect(() => {
    setHospitals([
      { id: 'H001', name: 'KMC Hospital', location: 'Srirangam, Trichy', bedsAvailable: 50, phone: '9876543212' },
      { id: 'H002', name: 'Apollo Hospital', location: 'Woraiyur, Trichy', bedsAvailable: 30, phone: '9876543213' },
      { id: 'H003', name: 'Govt Hospital', location: 'Trichy', bedsAvailable: 40, phone: '9876543214' }
    ]);
  }, []);

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

    // Check for booking commands
    if (lowerCommand.includes('book') || lowerCommand.includes('reserve') || lowerCommand.includes('need bed')) {
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
      speak('I can help you book hospital beds. Say "book a bed at KMC Hospital" or "show available hospitals"');
      setConfirmation('Try saying: "book a bed at hospital name"');
    }

    setTimeout(() => setIsProcessing(false), 2000);
  };

  // Extract booking information from voice command
  const extractBookingInfo = (command) => {
    let hospitalFound = null;
    let patientName = '';
    let urgency = 'normal';

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

    // Check urgency
    if (command.includes('emergency') || command.includes('urgent') || command.includes('critical')) {
      urgency = 'emergency';
    }

    if (hospitalFound) {
      const booking = {
        hospital: hospitalFound,
        patientName: patientName || 'Unknown Patient',
        urgency: urgency,
        timestamp: new Date(),
        bookingId: 'BK' + Date.now()
      };

      setBookingData(booking);
      setSelectedHospital(hospitalFound);
      
      const confirmationText = `Booking confirmed at ${hospitalFound.name} for ${booking.patientName}. ${hospitalFound.bedsAvailable} beds available. Booking ID: ${booking.bookingId}`;
      speak(confirmationText);
      setConfirmation(confirmationText);
      
      toast.success(`Voice booking successful! ${confirmationText}`);
    } else {
      speak('Please specify a hospital. Available hospitals are KMC Hospital, Apollo Hospital, and Government Hospital.');
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

  // Provide help information
  const provideHelp = () => {
    const helpText = 'I can help you book hospital beds. Try saying: "book a bed at KMC Hospital" or "show available hospitals" or "emergency booking at Apollo Hospital"';
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Hospitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hospitals.map(hospital => (
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
                </div>
              </div>
            ))}
          </div>
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
              <span className="text-gray-700">"Book a bed at KMC Hospital"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Emergency booking at Apollo Hospital"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Show available hospitals"</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">"Book for patient John Doe"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceBooking;
