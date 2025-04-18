import mongoose, { Schema, Document } from 'mongoose';

interface IOrder extends Document {
  client: string;
  description: string;
  value: number;
}

const OrderSchema: Schema = new Schema({
  client: { type: String, required: true },
  description: { type: String, required: true },
  value: { type: Number, required: true }
});

export default mongoose.model<IOrder>('Order', OrderSchema);