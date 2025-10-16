import axios from 'axios';
import User from '../models/User.js';

/**
 * Enviar mensagem via WhatsApp para a modelo
 * @param {string} recipientUserId - ID do usuário (modelo) no banco
 * @param {string} senderUserId - ID do usuário que está enviando
 * @param {string} message - Texto da mensagem
 */
export const sendWhatsAppMessage = async (recipientUserId, senderUserId, message) => {
  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!webhookUrl || !instance) {
      console.warn('⚠️ WhatsApp Webhook não configurado no .env');
      return {
        success: false,
        message: 'WhatsApp Webhook não configurado'
      };
    }

    // Buscar dados do remetente para obter telefone e nome
    const sender = await User.findById(senderUserId);
    
    if (!sender || !sender.phone) {
      console.error('❌ Remetente não encontrado ou sem telefone:', senderUserId);
      return {
        success: false,
        message: 'Dados do remetente não encontrados'
      };
    }

    // Formatar telefone no padrão WhatsApp (adicionar 55 se não tiver)
    let remoteJid = sender.phone;
    if (!remoteJid.startsWith('55')) {
      remoteJid = '55' + remoteJid;
    }

    console.log('📱 Enviando mensagem via WhatsApp');
    console.log('   📍 URL:', webhookUrl);
    console.log('   📞 De (telefone):', remoteJid);
    console.log('   👤 De (nome):', sender.name);
    console.log('   🎯 Para (id-modelo):', recipientUserId);
    console.log('   💬 Mensagem:', message);

    // Montar payload no formato esperado
    const payload = {
      instance: instance,
      remoteJid: remoteJid,
      fromMe: false,
      pushName: sender.name,
      conversation: message,
      messageType: 'conversation',
      'id-modelo': recipientUserId  // ID da modelo no banco de dados
    };

    console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      webhookUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos
      }
    );

    console.log('✅ Mensagem enviada via WhatsApp:', response.data);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Erro ao enviar via WhatsApp:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    // Não falhar a mensagem no chat se o WhatsApp falhar
    return {
      success: false,
      error: error.message
    };
  }
};

