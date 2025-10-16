import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  photos: [{
    type: String
  }],
  coverPhoto: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  pricePerMessage: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  totalChats: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Adicionar campo virtual para sempre ter o userId como string
modelSchema.virtual('userIdString').get(function() {
  return this.userId?._id?.toString() || this.userId?.toString();
});

const Model = mongoose.model('Model', modelSchema);

export default Model;

