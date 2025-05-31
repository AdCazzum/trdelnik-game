const express = require('express');
const cors = require('cors');
const { fileURLToPath } = require('url');
const { dirname } = require('path');
const meritsRouter = require('./routes/merits');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add Merits routes
app.use('/api/merits', meritsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 