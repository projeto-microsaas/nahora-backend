import { Router, Request, Response } from 'express';
import Order from '../models/Order';

const router = Router();

// Create an order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

// List orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error listing orders' });
  }
});

export default router;