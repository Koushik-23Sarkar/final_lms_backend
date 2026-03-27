require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');


const tenantRoutes = require('./routes/tenantRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const lmsRoutes = require('./routes/lmsRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tenants', tenantRoutes);
app.use('/api/admin', superAdminRoutes);
app.use('/api/lms', lmsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Multi-Tenant LMS backend running on port ${PORT}`);
});
