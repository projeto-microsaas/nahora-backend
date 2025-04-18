const express = require('express');
      const Order = require('../models/Order');

      const router = express.Router();

      // Create an order
      router.post('/orders', async (req, res) => {
        try {
          if (!req.body.client || req.body.client.trim() === '') {
            return res.status(400).json({ error: 'Client name is required' });
          }
          if (!req.body.description || req.body.description.trim() === '') {
            return res.status(400).json({ error: 'Description is required' });
          }
          if (req.body.value <= 0) {
            return res.status(400).json({ error: 'Value must be positive' });
          }
          const order = new Order(req.body);
          await order.save();
          res.status(201).json(order);
        } catch (error) {
          res.status(500).json({ error: 'Error creating order' });
        }
      });

      // List all orders or filter by client and/or minValue
      router.get('/orders', async (req, res) => {
        try {
          const { client, minValue } = req.query;
          const query = {};
          if (client) query.client = { $regex: client, $options: 'i' };
          if (minValue) query.value = { $gte: Number(minValue) };
          const orders = await Order.find(query);
          res.status(200).json(orders);
        } catch (error) {
          res.status(500).json({ error: 'Error listing orders' });
        }
      });

      // Get a single order by ID
      router.get('/orders/:id', async (req, res) => {
        try {
          const order = await Order.findById(req.params.id);
          if (!order) {
            return res.status(404).json({ error: 'Order not found' });
          }
          res.status(200).json(order);
        } catch (error) {
          res.status(500).json({ error: 'Error retrieving order' });
        }
      });

      // Update an order
      router.put('/orders/:id', async (req, res) => {
        try {
          if (req.body.value <= 0) {
            return res.status(400).json({ error: 'Value must be positive' });
          }
          const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
          });
          if (!order) {
            return res.status(404).json({ error: 'Order not found' });
          }
          res.status(200).json(order);
        } catch (error) {
          res.status(500).json({ error: 'Error updating order' });
        }
      });

      // Update order status
      router.patch('/orders/:id/status', async (req, res) => {
        try {
          const { status } = req.body;
          if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
          }
          const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
          );
          if (!order) {
            return res.status(404).json({ error: 'Order not found' });
          }
          res.status(200).json(order);
        } catch (error) {
          res.status(500).json({ error: 'Error updating order status' });
        }
      });

      // Delete an order
      router.delete('/orders/:id', async (req, res) => {
        try {
          const order = await Order.findByIdAndDelete(req.params.id);
          if (!order) {
            return res.status(404).json({ error: 'Order not found' });
          }
          res.status(200).json({ message: 'Order deleted successfully' });
        } catch (error) {
          res.status(500).json({ error: 'Error deleting order' });
        }
      });

      // Count orders by status
      router.get('/orders/count/:status', async (req, res) => {
        try {
          const { status } = req.params;
          if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
          }
          const count = await Order.countDocuments({ status });
          res.status(200).json({ status, count });
        } catch (error) {
          res.status(500).json({ error: 'Error counting orders' });
        }
      });

      // List orders by date range
      router.get('/orders/by-date', async (req, res) => {
        try {
          const { startDate, endDate } = req.query;
          if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required' });
          }
          const orders = await Order.find({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          });
          res.status(200).json(orders);
        } catch (error) {
          res.status(500).json({ error: 'Error listing orders by date' });
        }
      });

      module.exports = router;