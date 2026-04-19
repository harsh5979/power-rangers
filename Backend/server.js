require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDb = require('./db');
const { errorMiddleware } = require('./middleware/error');

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/college-admin', require('./routes/collegeAdmin'));
app.use('/api/principal',     require('./routes/principal'));
app.use('/api/faculty',       require('./routes/faculty'));
app.use('/api/students',      require('./routes/students'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/marks',         require('./routes/marks'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/alerts',        require('./routes/alerts'));
app.use('/api/risk',          require('./routes/risk'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'TS-12 Academic Risk Detection API' }));
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { connectDb(); console.log(`Server on port ${PORT}`); });
