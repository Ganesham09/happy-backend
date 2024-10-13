import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: SchemaType.type.ObjectId, // One who is Subscribing
      ref: 'User',
    },
    channel: {
      type: SchemaType.type.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
