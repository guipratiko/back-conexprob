import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { io, connectedUsers } from '../server.js';
import crypto from 'crypto';

// @desc    Webhook para receber notificações de pagamento (Appmax/N8N)
// @route   POST /api/webhook/payment
// @access  Public (mas deve validar assinatura em produção)
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { 
      transactionId, 
      name, 
      email, 
      amount, 
      status, 
      cpf, 
      phone, 
      credits,
      WEBHOOK_SECRET 
    } = req.body;

    console.log('📨 Webhook recebido:', req.body);

    // Validar WEBHOOK_SECRET
    if (WEBHOOK_SECRET !== process.env.WEBHOOK_SECRET) {
      console.log('❌ WEBHOOK_SECRET inválido');
      return res.status(401).json({
        success: false,
        message: 'Não autorizado.'
      });
    }

    // Validação básica
    if (!transactionId || !status || !email || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos no webhook.'
      });
    }

    // Verificar se a transação já foi processada
    const existingTransaction = await Transaction.findOne({ transactionId });
    if (existingTransaction && existingTransaction.status === 'completed') {
      console.log('⚠️ Transação já processada:', transactionId);
      return res.status(200).json({
        success: true,
        message: 'Transação já foi processada anteriormente.'
      });
    }

    // Verificar se o pagamento foi aprovado
    const isApproved = status.toLowerCase() === 'aprovado' || status.toLowerCase() === 'completed';

    if (!isApproved) {
      console.log('⚠️ Pagamento não aprovado:', status);
      return res.status(200).json({
        success: true,
        message: 'Pagamento não aprovado, nenhuma ação tomada.'
      });
    }

    // Buscar usuário por email ou CPF
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { cpf: cpf ? cpf.replace(/\D/g, '') : '' }
      ]
    });

    const creditsAmount = parseInt(credits);

    if (user) {
      // Usuário já existe - SOMAR os créditos
      console.log(`👤 Usuário encontrado: ${user.email}`);
      user.credits += creditsAmount;
      await user.save();
      console.log(`✅ ${creditsAmount} créditos SOMADOS ao usuário ${user.email}. Total agora: ${user.credits}`);
    } else {
      // Usuário não existe - criar pré-cadastro
      console.log(`🆕 Criando pré-cadastro para: ${email}`);
      
      // Gerar token único para completar o registro
      const registrationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      user = new User({
        name,
        email: email.toLowerCase(),
        cpf: cpf ? cpf.replace(/\D/g, '') : '',
        phone: phone || '',
        credits: creditsAmount,
        isPasswordSet: false,
        registrationToken,
        registrationTokenExpires: tokenExpires,
        role: 'user',
        isActive: true
      });

      await user.save();
      
      console.log(`✅ Pré-cadastro criado com ${creditsAmount} créditos`);
      console.log(`🔑 Token de registro: ${registrationToken}`);
      console.log(`📧 Link: ${process.env.FRONTEND_URL}/complete-registration?token=${registrationToken}`);
      
      // TODO: Enviar email com link para criar senha
      // sendRegistrationEmail(user.email, registrationToken);
    }

    // Criar ou atualizar a transação
    if (existingTransaction) {
      existingTransaction.status = 'completed';
      existingTransaction.credits = creditsAmount;
      existingTransaction.userId = user._id;
      existingTransaction.type = 'purchase';
      await existingTransaction.save();
    } else {
      const transaction = new Transaction({
        transactionId,
        userId: user._id,
        type: 'purchase',
        amount: parseFloat(amount),
        credits: creditsAmount,
        status: 'completed',
        paymentMethod: 'pix',
        description: `Compra de ${creditsAmount} créditos`,
        metadata: { name, email, cpf, phone }
      });
      await transaction.save();
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso!',
      data: {
        transactionId,
        userId: user._id,
        email: user.email,
        credits: user.credits,
        isNewUser: !user.isPasswordSet,
        registrationToken: !user.isPasswordSet ? user.registrationToken : undefined
      }
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook.',
      error: error.message
    });
  }
};

// @desc    Webhook genérico para N8N
// @route   POST /api/webhook/n8n
// @access  Public
export const handleN8NWebhook = async (req, res) => {
  try {
    console.log('📨 Webhook N8N recebido:', req.body);

    // Processar conforme necessário
    // Aqui você pode implementar lógica específica para diferentes tipos de eventos

    res.status(200).json({
      success: true,
      message: 'Webhook N8N recebido com sucesso!',
      data: req.body
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook N8N:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook.',
      error: error.message
    });
  }
};

// @desc    Webhook para receber mensagens do WhatsApp (modelo respondendo)
// @route   POST /api/webhook/whatsapp
// @access  Public
export const handleWhatsAppMessage = async (req, res) => {
  try {
    console.log('📨 Webhook WhatsApp recebido:', JSON.stringify(req.body, null, 2));

    const { event, data, Frontend, 'id-user': userId } = req.body;

    // Validar se é mensagem nova
    if (event !== 'messages.upsert') {
      console.log('⚠️ Evento ignorado:', event);
      return res.status(200).json({
        success: true,
        message: 'Evento ignorado'
      });
    }

    // Validar se é mensagem do usuário (fromMe: false) e se é para o Frontend
    if (!data || data.key?.fromMe !== false || Frontend !== 'true') {
      console.log('⚠️ Mensagem ignorada - fromMe ou não é Frontend');
      return res.status(200).json({
        success: true,
        message: 'Mensagem ignorada'
      });
    }

    // Extrair dados
    const modeloUserId = userId; // ID do usuário da modelo no nosso banco
    const clientPhone = data.key.remoteJid.replace('@s.whatsapp.net', ''); // Telefone do cliente
    const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text;

    if (!messageContent) {
      console.log('⚠️ Mensagem sem conteúdo');
      return res.status(200).json({
        success: true,
        message: 'Mensagem sem conteúdo'
      });
    }

    console.log('💬 Mensagem da modelo:', modeloUserId);
    console.log('📞 Para cliente:', clientPhone);
    console.log('💭 Conteúdo:', messageContent);

    // Buscar a modelo pelo ID
    const modelo = await User.findById(modeloUserId);

    if (!modelo || modelo.role !== 'model') {
      console.error('❌ Modelo não encontrada:', modeloUserId);
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrada'
      });
    }

    // Buscar o cliente pelo telefone
    const cliente = await User.findOne({ phone: clientPhone });

    if (!cliente) {
      console.log('⚠️ Cliente não encontrado pelo telefone:', clientPhone);
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    console.log('✅ Cliente encontrado:', cliente.name, cliente._id);

    // Criar a mensagem
    const messageId = new mongoose.Types.ObjectId().toString();
    const newMessage = {
      _id: messageId,
      senderId: modelo._id,
      content: messageContent,
      type: 'text',
      creditsCharged: 0, // Modelo não paga para responder
      isRead: false,
      createdAt: new Date()
    };

    // Adicionar mensagem na conversa da modelo
    let modeloConversation = modelo.conversations.find(
      conv => conv.modelId.toString() === cliente._id.toString()
    );

    if (!modeloConversation) {
      modelo.conversations.push({
        modelId: cliente._id,
        messages: [newMessage],
        lastMessage: new Date(),
        unreadCount: 0
      });
    } else {
      modeloConversation.messages.push(newMessage);
      modeloConversation.lastMessage = new Date();
    }

    // Adicionar mensagem na conversa do cliente
    let clienteConversation = cliente.conversations.find(
      conv => conv.modelId.toString() === modelo._id.toString()
    );

    if (!clienteConversation) {
      cliente.conversations.push({
        modelId: modelo._id,
        messages: [newMessage],
        lastMessage: new Date(),
        unreadCount: 1
      });
    } else {
      clienteConversation.messages.push(newMessage);
      clienteConversation.lastMessage = new Date();
      clienteConversation.unreadCount += 1;
    }

    // Salvar ambos
    await Promise.all([modelo.save(), cliente.save()]);

    console.log('💾 Mensagem salva no banco');

    // Enviar via Socket.io para o cliente se estiver online
    try {
      const { connectedUsers } = await import('../server.js');
      const clienteSocketId = connectedUsers.get(cliente._id.toString());
      
      if (clienteSocketId && io) {
        console.log('📡 Enviando via Socket.io para cliente:', cliente._id.toString());
        io.to(clienteSocketId).emit('receive-message', {
          message: newMessage,
          senderId: modelo._id.toString()
        });
        console.log('✅ Mensagem enviada via Socket.io');
      } else {
        console.log('⚠️ Cliente não está online no Socket.io');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar via Socket.io:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem processada com sucesso',
      data: {
        messageId,
        clienteId: cliente._id,
        modeloId: modelo._id
      }
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook',
      error: error.message
    });
  }
};

