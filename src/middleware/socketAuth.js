import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token não fornecido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('Usuário inválido'));
    }

    // Anexar userId ao socket
    socket.userId = user._id.toString();
    socket.user = {
      id: user._id,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação Socket.io:', error);
    next(new Error('Falha na autenticação'));
  }
};

