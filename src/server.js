import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/authRoutes.js';
import modelRoutes from './routes/modelRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Importar middleware Socket.io
import { socketAuth } from './middleware/socketAuth.js';

// Importar controller de chat
import { sendMessage } from './controllers/chatController.js';
import User from './models/User.js';

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configurar CORS para aceitar múltiplas origens
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origem bloqueada pelo CORS:', origin);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '🔥 ConexaoProibida API está rodando!',
    version: '1.0.0'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/chat', chatRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Configurar Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Mapa para rastrear usuários conectados: userId -> socketId
const connectedUsers = new Map();

// Middleware de autenticação Socket.io
io.use(socketAuth);

// Eventos Socket.io
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`✅ Usuário conectado: ${userId}`);

  // Adicionar ao mapa de usuários conectados
  connectedUsers.set(userId, socket.id);

  // Entrar na sala do próprio usuário
  socket.join(userId);

  // Evento: Enviar mensagem
  socket.on('send-message', async (data) => {
    try {
      const { recipientId, content, type = 'text' } = data;

      // Criar req mockado para reusar o controller
      const mockReq = {
        userId: userId,
        body: { recipientId, content, type }
      };

      const mockRes = {
        status: (code) => ({
          json: (response) => {
            if (response.success) {
              // Enviar confirmação para o sender
              socket.emit('message-sent', response.data);

              // Enviar mensagem para o recipient se estiver online
              const recipientSocketId = connectedUsers.get(recipientId);
              if (recipientSocketId) {
                io.to(recipientSocketId).emit('receive-message', {
                  message: response.data.message,
                  senderId: userId
                });
              }
            } else {
              socket.emit('message-error', {
                message: response.message
              });
            }
          }
        })
      };

      await sendMessage(mockReq, mockRes);
    } catch (error) {
      console.error('Erro ao enviar mensagem via Socket.io:', error);
      socket.emit('message-error', {
        message: 'Erro ao enviar mensagem'
      });
    }
  });

  // Evento: Usuário está digitando
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const recipientSocketId = connectedUsers.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-typing', {
        userId,
        isTyping
      });
    }
  });

  // Evento: Marcar mensagens como lidas
  socket.on('mark-read', async (data) => {
    try {
      const { modelId } = data;
      const user = await User.findById(userId);

      if (user) {
        const conversation = user.conversations.find(
          conv => conv.modelId.toString() === modelId
        );

        if (conversation) {
          conversation.messages.forEach(msg => {
            if (msg.senderId.toString() !== userId) {
              msg.isRead = true;
            }
          });
          conversation.unreadCount = 0;
          await user.save();

          socket.emit('messages-read', { modelId });
        }
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  });

  // Evento: Desconexão
  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${userId}`);
    connectedUsers.delete(userId);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP rodando na porta ${PORT}`);
    console.log(`⚡ Socket.io pronto para conexões`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
});

export default app;
export { io, connectedUsers };

