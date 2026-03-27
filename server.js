require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');


const tenantRoutes = require('./routes/tenantRoutes');
const studentRoutes = require('./routes/studentRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tenants', tenantRoutes);
app.use('/api/lms/students', studentRoutes);
app.use('/api/admin', superAdminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Multi-Tenant LMS backend running on port ${PORT}`);
});
