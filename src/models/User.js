import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  password: {
    type: String,
    required: false, // Permitir pré-cadastro sem senha
    minlength: 6
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  role: {
    type: String,
    enum: ['user', 'model', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPasswordSet: {
    type: Boolean,
    default: false
  },
  registrationToken: {
    type: String,
    default: null
  },
  registrationTokenExpires: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  conversations: [{
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    messages: [{
      _id: String,
      senderId: mongoose.Schema.Types.ObjectId,
      content: String,
      type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
      },
      creditsCharged: {
        type: Number,
        default: 0
      },
      isRead: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastMessage: Date,
    unreadCount: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Não retornar a senha nas queries
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;

