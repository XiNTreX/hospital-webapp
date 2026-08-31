'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGUI() {
  const router = useRouter();
  
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [action, setAction] = useState<string>('SELECT');
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [conditionCol, setConditionCol] = useState<string>('');
  const [conditionVal, setConditionVal] = useState<string>('');
  const [updateCol, setUpdateCol] = useState<string>('');
  const [updateVal, setUpdateVal] = useState<string>('');
  
  const [results, setResults] = useState<{ command?: string; rowCount?: number; rows?: Record<string, unknown>[] } | null>(null);
  const [error, setError] = useState<string>('');

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
        const data: Record<string, string[]> = await res.json();
        setSchema(data);
        
        const tables = Object.keys(data);
        if (tables.length > 0) {
          setSelectedTable(tables[0]);
          setConditionCol(data[tables[0]][0] || '');
          setUpdateCol(data[tables[0]][0] || '');
        }
      } catch {
        setError('Failed to load database schema.');
      }
    };

    fetchSchema();
  }, [router]);

  const handleActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setAction(e.target.value);
    setFormData({});
    setResults(null);
    setError('');
  };

  const handleTableChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    if (schema[newTable] && schema[newTable].length > 0) {
      setConditionCol(schema[newTable][0]);
      setUpdateCol(schema[newTable][0]);
    }
    setFormData({});
    setResults(null);
  };

  const executeOperation = async () => {
    setError('');
    setResults(null);
    
    let query = '';
    let values: string[] = [];

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
    } catch {
      setError('Failed to connect to the server.');
    }
  };

  const currentColumns = schema[selectedTable] || [];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Database Management Interface</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 px-4 py-2 rounded-xl font-medium transition"
          >
            Log Out
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Target Table</label>
              <select value={selectedTable} onChange={handleTableChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none">
                {Object.keys(schema).map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            
            <div className="w-1/2">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Action</label>
              <select value={action} onChange={handleActionChange} className="w-full p-3 rounded-xl bg-slate-800 border border-teal-500/50 text-teal-400 font-semibold outline-none">
                <option value="SELECT">View Data (SELECT)</option>
                <option value="INSERT">Add New Record (INSERT)</option>
                <option value="UPDATE">Modify Record (UPDATE)</option>
                <option value="DELETE">Remove Record (DELETE)</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-800" />

          <div className="space-y-4">
            {action === 'INSERT' && (
              <div className="grid grid-cols-2 gap-4">
                {currentColumns.map(col => (
                  <div key={col}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{col}</label>
                    <input 
                      type="text" 
                      placeholder={`Enter ${col}...`}
                      className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-teal-400"
                      value={formData[col] || ''}
                      onChange={(e) => setFormData({...formData, [col]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            )}

            {action === 'UPDATE' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <h3 className="font-semibold text-teal-400 mb-3">1. Find the record:</h3>
                  <div className="flex gap-4 items-center">
                    <span>Where</span>
                    <select value={conditionCol} onChange={(e) => setConditionCol(e.target.value)} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                    <span>equals</span>
                    <input type="text" placeholder="Value..." className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex-1" value={conditionVal} onChange={(e) => setConditionVal(e.target.value)} />
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <h3 className="font-semibold text-teal-400 mb-3">2. Change the data:</h3>
                  <div className="flex gap-4 items-center">
                    <span>Set</span>
                    <select value={updateCol} onChange={(e) => setUpdateCol(e.target.value)} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                    <span>to new value</span>
                    <input type="text" placeholder="New value..." className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex-1" value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {action === 'DELETE' && (
              <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl flex gap-4 items-center">
                <span className="text-rose-400 font-semibold">Delete where</span>
                <select value={conditionCol} onChange={(e) => setConditionCol(e.target.value)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                  {currentColumns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <span className="text-rose-400 font-semibold">equals</span>
                <input type="text" placeholder="Value..." className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex-1 text-white" value={conditionVal} onChange={(e) => setConditionVal(e.target.value)} />
              </div>
            )}
          </div>

          <button 
            onClick={executeOperation}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-500/20"
          >
            Execute {action}
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {results && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <p className="text-sm text-slate-400 mb-4">
              Operation <span className="font-bold text-teal-400">{results.command}</span> completed. Rows affected: <span className="font-bold text-teal-400">{results.rowCount}</span>
            </p>
            
            {results.rows && results.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      {Object.keys(results.rows[0]).map(key => (
                        <th key={key} className="px-4 py-2 font-semibold text-slate-300">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50 border-b border-slate-800/60 transition">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-2 text-slate-300">
                            {val !== null ? String(val) : <span className="text-slate-600 italic">null</span>}
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