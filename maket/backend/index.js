if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Layout Schema
const layoutSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: Object, required: true }, // Stores the JSON graphData
  createdAt: { type: Date, default: Date.now },
});
const Layout = mongoose.model('Layout', layoutSchema);

// API Routes
// Save Layout
app.post('/api/layouts', async (req, res) => {
  try {
    const { name, data } = req.body;
    const layout = new Layout({ name, data });
    await layout.save();
    res.status(201).json({ message: 'Layout saved', id: layout._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save layout' });
  }
});

// Load All Layouts (for selection)
app.get('/api/layouts', async (req, res) => {
  try {
    const layouts = await Layout.find({}, 'name _id createdAt');
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layouts' });
  }
});

// Load Specific Layout by ID
app.get('/api/layouts/:id', async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Layout not found' });
    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layout' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});