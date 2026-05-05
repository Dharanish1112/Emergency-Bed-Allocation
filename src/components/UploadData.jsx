import React from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvglP96CSOMZRkZMFz7g5XESARi_3MAKY",
  authDomain: "bed-allocation-system.firebaseapp.com",
  databaseURL: "https://bed-allocation-system-default-rtdb.firebaseio.com",
  projectId: "bed-allocation-system",
  storageBucket: "bed-allocation-system.firebasestorage.app",
  messagingSenderId: "1029857894545",
  appId: "1:1029857894545:web:74a6a29e75fcea0c381f30",
  measurementId: "G-05M653TR2L"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

function UploadData() {

  const uploadData = async () => {
    try {
      // Replace with your Google Sheet ID
      const sheetId = "YOUR_GOOGLE_SHEET_ID";
      const range = "Sheet1!A:Z"; // Adjust range as needed
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&range=${range}`;
      
      const res = await fetch(url);
      const text = await res.text();
      
      // Parse Google Sheets response
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonText);
      
      if (data.table && data.table.rows) {
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i].c;
          
          if (row && row[1] && row[2] && row[5]) {
            await addDoc(collection(db, "drivers"), {
              name: row[1].v,
              phone: row[2].v,
              location: row[5].v,
              uploadedAt: new Date()
            });
          }
        }
        
        alert(`Successfully uploaded ${data.table.rows.length - 1} drivers to Firebase! 🔥`);
      } else {
        alert("No data found in Google Sheets");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload data. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={uploadData}>
        Upload Drivers Data 🚀
      </button>
    </div>
  );
}

export default UploadData;
