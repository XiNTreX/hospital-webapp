'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGUI() {
  const router = useRouter();
  
  // State for Schema and Selections
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [selectedTable, setSelectedTable] = useState('');
  const [action, setAction] = useState('SELECT'); // SELECT, INSERT, UPDATE, DELETE
  
  // State for Form Inputs
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [conditionCol, setConditionCol] = useState('');
  const [conditionVal, setConditionVal] = useState('');
  const [updateCol, setUpdateCol] = useState('');
  const [updateVal, setUpdateVal] = useState('');
  
  // State for Results/Errors
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  // 1. Verify clearance and fetch database schema on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchSchema = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/admin/schema', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSchema(data);
        
        // Default to the first table in the list if available
        const tables = Object.keys(data);
        if (tables.length > 0) {
          setSelectedTable(tables[0]);
          setConditionCol(data[tables[0]][0]);
          setUpdateCol(data[tables[0]][0]);
        }
      } catch (err) {
        setError('Failed to load database schema.');
      }
    };

    fetchSchema();
  }, [router]);

  // Handle Action Change (Reset fields)
  const handleActionChange = (e: any) => {
    setAction(e.target.value);
    setFormData({});
    setResults(null);
    setError('');
  };

  // Handle Table Change
  const handleTableChange = (e: any) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    setConditionCol(schema[newTable][0]);
    setUpdateCol(schema[newTable][0]);
    setFormData({});
    setResults(null);
  };

  // 2. Dynamically build and execute the SQL query based on UI inputs
  const executeOperation = async () => {
    setError('');
    setResults(null);
    
    let query = '';
    let values: string[] = [];

    // Safely construct parameterized queries
    if (action === 'SELECT') {
      query = `SELECT * FROM "${selectedTable}" LIMIT 100`;
    } 
    else if (action === 'INSERT') {
      const cols = Object.keys(formData).filter(k => formData[k] !== '');
      if (cols.length === 0) return setError('Please fill out at least one field.');
      
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      values = cols.map(k => formData[k]);
      query = `INSERT INTO "${selectedTable}" (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    } 
    else if (action === 'UPDATE') {
      if (!updateVal || !conditionVal) return setError('Please provide both an update value and a condition value.');
      query = `UPDATE "${selectedTable}" SET ${updateCol} = $1 WHERE ${conditionCol} = $2 RETURNING *`;
      values = [updateVal, conditionVal];
    } 
    else if (action === 'DELETE') {
      if (!conditionVal) return setError('Please provide a condition value to delete.');
      query = `DELETE FROM "${selectedTable}" WHERE ${conditionCol} = $1 RETURNING *`;
      values = [conditionVal];
    }

    // Send to backend
    try {
      const response = await fetch('http://localhost:5001/api/admin/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query, values })
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Operation failed.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
  };

  const currentColumns = schema[selectedTable] || [];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Database Management Interface</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-medium transition"
          >
            Log Out
          </button>
        </div>

        {/* GUI Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Table</label>
              <select value={selectedTable} onChange={handleTableChange} className="w-full p-3 border rounded-lg bg-gray-50">
                {Object.keys(schema).map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Action</label>
              <select value={action} onChange={handleActionChange} className="w-full p-3 border rounded-lg bg-blue-50 text-blue-800 font-semibold">
                <option value="SELECT">View Data (SELECT)</option>
                <option value="INSERT">Add New Record (INSERT)</option>
                <option value="UPDATE">Modify Record (UPDATE)</option>
                <option value="DELETE">Remove Record (DELETE)</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dynamic Forms based on Action */}
          <div className="space-y-4">
            
            {/* INSERT FORM */}
            {action === 'INSERT' && (
              <div className="grid grid-cols-2 gap-4">
                {currentColumns.map(col => (
                  <div key={col}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{col}</label>
                    <input 
                      type="text" 
                      placeholder={`Enter ${col}...`}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      value={formData[col] || ''}
                      onChange={(e) => setFormData({...formData, [col]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* UPDATE FORM */}
            {action === 'UPDATE' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-3">1. Find the record:</h3>
                  <div className="flex gap-4 items-center">
                    <span>Where</span>
                    <select value={conditionCol} onChange={(e) => setConditionCol(e.target.value)} className="p-2 border rounded bg-white">
                      {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                    <span>equals</span>
                    <input type="text" placeholder="Value..." className="p-2 border rounded flex-1" value={conditionVal} onChange={(e) => setConditionVal(e.target.value)} />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3">2. Change the data:</h3>
                  <div className="flex gap-4 items-center">
                    <span>Set</span>
                    <select value={updateCol} onChange={(e) => setUpdateCol(e.target.value)} className="p-2 border rounded bg-white">
                      {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                    <span>to new value</span>
                    <input type="text" placeholder="New value..." className="p-2 border rounded flex-1" value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* DELETE FORM */}
            {action === 'DELETE' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-4 items-center">
                <span className="text-red-800 font-semibold">Delete where</span>
                <select value={conditionCol} onChange={(e) => setConditionCol(e.target.value)} className="p-2 border rounded bg-white">
                  {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <span className="text-red-800 font-semibold">equals</span>
                <input type="text" placeholder="Value..." className="p-2 border rounded flex-1" value={conditionVal} onChange={(e) => setConditionVal(e.target.value)} />
              </div>
            )}

          </div>

          <button 
            onClick={executeOperation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition"
          >
            Execute {action}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-4 rounded text-sm">
            {error}
          </div>
        )}

        {/* Results Area */}
        {results && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-4">
              Operation <span className="font-bold text-gray-900">{results.command}</span> completed. Rows affected: <span className="font-bold text-gray-900">{results.rowCount}</span>
            </p>
            
            {results.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(results.rows[0]).map(key => (
                        <th key={key} className="px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-2 border-b border-gray-100 text-gray-600">
                            {val !== null ? String(val) : <span className="text-gray-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}