import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import ordersRouter from './routes/orders';

const app = express();
const port = 5000;

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://admin:password@localhost:27017/ontime?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Use routes
app.use('/api', ordersRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to OnTime!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});