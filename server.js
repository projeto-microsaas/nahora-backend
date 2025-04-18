const express = require('express');
const mongoose = require('mongoose');
const ordersRouter = require('./routes/orders');

const app = express();
const port = 5000;

app.use(express.json());

mongoose.connect('mongodb://admin:password@localhost:27017/nahora?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

app.use('/api', ordersRouter);

app.get('/', (req, res) => {
  res.send('Welcome to NaHora!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});