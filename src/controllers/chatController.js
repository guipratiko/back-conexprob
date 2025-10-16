import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

// @desc    Listar todas as conversas do usuário
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('conversations.modelId', 'name avatar role')
      .select('conversations');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Ordenar conversas por última mensagem
    const conversations = user.conversations
      .map(conv => ({
        modelId: conv.modelId,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount,
        lastMessagePreview: conv.messages[conv.messages.length - 1]?.content || ''
      }))
      .sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));

    res.status(200).json({
      success: true,
      data: {
        conversations
      }
    });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar conversas',
      error: error.message
    });
  }
};

// @desc    Obter histórico completo de uma conversa
// @route   GET /api/chat/conversation/:modelId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { modelId } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Encontrar a conversa específica
    const conversation = user.conversations.find(
      conv => conv.modelId.toString() === modelId
    );

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: {
          messages: []
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Erro ao obter conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter conversa',
      error: error.message
    });
  }
};

// @desc    Enviar mensagem
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, type = 'text' } = req.body;
    const senderId = req.userId;

    // Validações
    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário e conteúdo são obrigatórios'
      });
    }

    // Buscar sender e recipient
    console.log('🔍 Buscando usuários - Sender:', senderId, 'Recipient:', recipientId);
    
    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId)
    ]);

    console.log('👤 Sender encontrado:', sender ? 'Sim' : 'Não');
    console.log('👤 Recipient encontrado:', recipient ? 'Sim' : 'Não');

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Seu usuário não foi encontrado. Faça login novamente.'
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrada. Por favor, selecione outra modelo.'
      });
    }

    // Verificar se recipient é uma modelo
    const isRecipientModel = recipient.role === 'model';
    const creditsCharged = 0; // Créditos serão debitados externamente

    // Buscar informações da modelo para envio do WhatsApp
    let modelProfile = null;
    if (isRecipientModel) {
      const Model = mongoose.model('Model');
      modelProfile = await Model.findOne({ userId: recipientId });
    }

    // Criar mensagem
    const messageId = new mongoose.Types.ObjectId().toString();
    const message = {
      _id: messageId,
      senderId: senderId,
      content,
      type,
      creditsCharged,
      isRead: false,
      createdAt: new Date()
    };

    // Adicionar mensagem na conversa do sender
    let senderConversation = sender.conversations.find(
      conv => conv.modelId.toString() === recipientId
    );

    if (!senderConversation) {
      sender.conversations.push({
        modelId: recipientId,
        messages: [message],
        lastMessage: new Date(),
        unreadCount: 0
      });
    } else {
      senderConversation.messages.push(message);
      senderConversation.lastMessage = new Date();
    }

    // Adicionar mensagem na conversa do recipient
    let recipientConversation = recipient.conversations.find(
      conv => conv.modelId.toString() === senderId
    );

    if (!recipientConversation) {
      recipient.conversations.push({
        modelId: senderId,
        messages: [message],
        lastMessage: new Date(),
        unreadCount: 1
      });
    } else {
      recipientConversation.messages.push(message);
      recipientConversation.lastMessage = new Date();
      recipientConversation.unreadCount += 1;
    }

    // Salvar ambos usuários
    await Promise.all([sender.save(), recipient.save()]);

    // Se recipient é modelo, enviar também via WhatsApp
    if (isRecipientModel) {
      console.log('📱 Preparando envio via WhatsApp');
      console.log('   De (userId):', senderId);
      console.log('   Para (userId):', recipientId);
      
      // Enviar de forma assíncrona (não bloquear a resposta)
      sendWhatsAppMessage(recipientId, senderId, content).catch(err => {
        console.error('❌ Erro ao enviar WhatsApp (não crítico):', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        message
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
};

// @desc    Marcar mensagens como lidas
// @route   PATCH /api/chat/read/:modelId
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { modelId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Encontrar a conversa
    const conversation = user.conversations.find(
      conv => conv.modelId.toString() === modelId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Marcar todas as mensagens como lidas
    conversation.messages.forEach(msg => {
      if (msg.senderId.toString() !== userId) {
        msg.isRead = true;
      }
    });

    // Resetar contador de não lidas
    conversation.unreadCount = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar mensagens como lidas',
      error: error.message
    });
  }
};

