// FRONTEND APP
import React, { useState, useEffect } from 'react';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [jobId, setJobId] = useState(null);

  const generatePDF = async () => {
    setStatus('requesting');
    const res = await fetch('http://localhost:3001/api/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: '123', data: { executiveSummary: 'test' } })
    });
    const data = await res.json();
    setJobId(data.jobId);
    setStatus('processing');
  };

  useEffect(() => {
    if (status === 'processing' && jobId) {
      const interval = setInterval(async () => {
        const res = await fetch(`http://localhost:3001/api/pdf/status/${jobId}`);
        const data = await res.json();
        if (data.status === 'completed') {
          setStatus('completed');
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, jobId]);

  return (
    <div>
      <h1>Career Risk Calculator</h1>
      <button onClick={generatePDF}>Generate Report</button>
      <p>Status: {status}</p>
      {status === 'completed' && <a href="/download/report.pdf">Download PDF</a>}
    </div>
  );
}
