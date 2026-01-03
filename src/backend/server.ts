// BACKEND SERVER
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

const jobs = new Map();

app.post('/api/pdf/generate', (req, res) => {
  const jobId = Math.random().toString(36).substring(7);
  jobs.set(jobId, { status: 'processing' });

  // Simulate worker
  setTimeout(() => {
    jobs.set(jobId, {
      status: 'completed',
      result: { url: '/download/report.pdf', status: 'completed' }
    });
  }, 2000);

  res.json({ jobId });
});

app.get('/api/pdf/status/:id', (req, res) => {
  const status = jobs.get(req.params.id);
  res.json(status || { status: 'not_found' });
});

app.listen(3001, () => console.log('Backend running on 3001'));
