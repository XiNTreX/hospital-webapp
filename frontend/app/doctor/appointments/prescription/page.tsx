'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PrescriptionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Catalogs
  const [catalogMedicines, setCatalogMedicines] = useState<any[]>([]);
  const [catalogTests, setCatalogTests] = useState<any[]>([]);
  const [patientData, setPatientData] = useState<any>(null);

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  
  // Dynamic Arrays
  const [medicines, setMedicines] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  // Temporary inputs for the 'Add' buttons
  const [medInput, setMedInput] = useState({ medicine_id: '', frequency: '1+0+1', duration: '7 days', before_after_meal: 'After Meal' });
  const [testInput, setTestInput] = useState('');

  useEffect(() => {
    if (!appointmentId) return;

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [aptRes, medRes, testRes] = await Promise.all([
          fetch(`http://localhost:5001/api/doctor/appointments/${appointmentId}`, { headers }),
          fetch(`http://localhost:5001/api/doctor/medicines`, { headers }),
          fetch(`http://localhost:5001/api/doctor/tests`, { headers })
        ]);

        if (aptRes.ok) setPatientData(await aptRes.json());
        if (medRes.ok) setCatalogMedicines(await medRes.json());
        if (testRes.ok) setCatalogTests(await testRes.json());
      } catch (error) {
        console.error('Error fetching prescription data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  const handleAddMedicine = () => {
    if (!medInput.medicine_id) return;
    const medDetails = catalogMedicines.find(m => m.medicine_id.toString() === medInput.medicine_id);
    setMedicines([...medicines, { ...medInput, name: medDetails?.name, dosage: medDetails?.dosage }]);
    // Reset temp input
    setMedInput({ medicine_id: '', frequency: '1+0+1', duration: '7 days', before_after_meal: 'After Meal' });
  };

  const handleAddTest = () => {
    if (!testInput) return;
    const testDetails = catalogTests.find(t => t.test_id.toString() === testInput);
    if (tests.find(t => t.test_id.toString() === testInput)) return; // Prevent duplicates
    setTests([...tests, { test_id: testInput, name: testDetails?.name }]);
    setTestInput('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const payload = {
      appointment_id: appointmentId,
      patient_id: patientData.patient_id,
      diagnosis,
      advice,
      medicines: medicines.map(m => ({
        medicine_id: parseInt(m.medicine_id),
        frequency: m.frequency,
        duration: m.duration,
        before_after_meal: m.before_after_meal
      })),
      tests: tests.map(t => parseInt(t.test_id))
    };

    try {
      const response = await fetch('http://localhost:5001/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Prescription saved! Appointment marked as Completed.');
        router.push('/doctor/appointments');
      } else {
        alert('Failed to save prescription');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10">Loading patient data...</div>;
  if (!patientData) return <div className="p-10 text-rose-600">Patient appointment not found.</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {patientData.first_name} {patientData.last_name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {patientData.gender} • Blood Group: {patientData.blood_group}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-700">Date: {patientData.date.split('T')[0]}</p>
          <p className="text-xs text-slate-500">Appointment ID: #{appointmentId}</p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis / Patient Problem</label>
        <textarea
          rows={3}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900"
          placeholder="e.g., Viral Fever with acute Pharyngitis..."
        />
      </div>

      {/* Medicines Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Prescribe Medicines</h2>
        
        <div className="flex gap-3">
          <select 
            value={medInput.medicine_id}
            onChange={(e) => setMedInput({...medInput, medicine_id: e.target.value})}
            className="flex-1 p-3 border border-slate-300 rounded-xl text-sm text-slate-900"
          >
            <option value="">-- Search & Select Medicine --</option>
            {catalogMedicines.map(m => (
              <option key={m.medicine_id} value={m.medicine_id}>{m.name} ({m.dosage})</option>
            ))}
          </select>
          
          <input 
            type="text" 
            placeholder="1+0+1" 
            value={medInput.frequency}
            onChange={(e) => setMedInput({...medInput, frequency: e.target.value})}
            className="w-24 p-3 border border-slate-300 rounded-xl text-sm text-slate-900"
          />
          
          <input 
            type="text" 
            placeholder="7 days" 
            value={medInput.duration}
            onChange={(e) => setMedInput({...medInput, duration: e.target.value})}
            className="w-24 p-3 border border-slate-300 rounded-xl text-sm text-slate-900"
          />

          <select 
            value={medInput.before_after_meal}
            onChange={(e) => setMedInput({...medInput, before_after_meal: e.target.value})}
            className="w-36 p-3 border border-slate-300 rounded-xl text-sm text-slate-900"
          >
            <option value="After Meal">After Meal</option>
            <option value="Before Meal">Before Meal</option>
          </select>

          <button onClick={handleAddMedicine} className="px-5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900">
            Add
          </button>
        </div>

        {/* Added Medicines List */}
        {medicines.length > 0 && (
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <ul className="space-y-2">
              {medicines.map((m, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-800">Rx: {m.name}</span> <span className="text-slate-500">({m.dosage})</span> — 
                    <span className="font-semibold text-blue-700 ml-2">{m.frequency}</span> for {m.duration} ({m.before_after_meal})
                  </div>
                  <button onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="text-rose-500 font-bold hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tests Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Advise Tests</h2>
        <div className="flex gap-3">
          <select 
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="flex-1 p-3 border border-slate-300 rounded-xl text-sm text-slate-900"
          >
            <option value="">-- Search & Select Test --</option>
            {catalogTests.map(t => (
              <option key={t.test_id} value={t.test_id}>{t.name}</option>
            ))}
          </select>
          <button onClick={handleAddTest} className="px-5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900">
            Add Test
          </button>
        </div>

        {tests.length > 0 && (
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap gap-2">
              {tests.map((t, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-2">
                  {t.name}
                  <button onClick={() => setTests(tests.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advice & Submit */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2">General Advice</label>
        <textarea
          rows={3}
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 mb-4"
          placeholder="e.g., Drink plenty of water, rest for 3 days..."
        />

        <div className="flex justify-end">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || medicines.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Saving...' : 'Save Prescription'}
          </button>
        </div>
      </div>

    </div>
  );
}

// Wrap in suspense to handle Next.js client-side search params smoothly
export default function PrescriptionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-slate-500">Loading prescription module...</div>}>
      <PrescriptionForm />
    </Suspense>
  );
}