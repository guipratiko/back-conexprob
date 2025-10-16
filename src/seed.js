import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Model from './models/Model.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar coleções
    await User.deleteMany({});
    await Model.deleteMany({});
    console.log('🧹 Banco limpo');

    // Criar usuários modelos
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const modelUsers = await User.insertMany([
      {
        name: 'Isabella Santos',
        email: 'isabella@exemplo.com',
        cpf: '11111111111',
        phone: '11999990001',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Larissa Oliveira',
        email: 'larissa@exemplo.com',
        cpf: '22222222222',
        phone: '11999990002',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Camila Silva',
        email: 'camila@exemplo.com',
        cpf: '33333333333',
        phone: '6298445636',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Fernanda Costa',
        email: 'fernanda@exemplo.com',
        cpf: '44444444444',
        phone: '11999990004',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Juliana Alves',
        email: 'juliana@exemplo.com',
        cpf: '55555555555',
        phone: '11999990005',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Gabriela Martins',
        email: 'gabriela@exemplo.com',
        cpf: '66666666666',
        phone: '8599990006',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Amanda Rodrigues',
        email: 'amanda@exemplo.com',
        cpf: '77777777777',
        phone: '11999990007',
        password: hashedPassword,
        role: 'model',
        credits: 0
      },
      {
        name: 'Bianca Ferreira',
        email: 'bianca@exemplo.com',
        cpf: '88888888888',
        phone: '7199990008',
        password: hashedPassword,
        role: 'model',
        credits: 0
      }
    ]);

    console.log('👥 Usuários modelos criados');

    // Criar perfis de modelos
    const models = [
      {
        userId: modelUsers[0]._id,
        name: 'Isabella Santos',
        bio: 'Oi! Sou a Isa, adoro conversar e conhecer pessoas novas. Vamos bater um papo? 😘',
        age: 23,
        pricePerMessage: 5,
        coverPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
        isOnline: true,
        rating: 4.9,
        totalChats: 156,
        tags: ['Simpática', 'Carinhosa', 'Divertida']
      },
      {
        userId: modelUsers[1]._id,
        name: 'Larissa Oliveira',
        bio: 'Hey! Sou extrovertida e amo fazer novos amigos. Vem conversar comigo! 💕',
        age: 25,
        pricePerMessage: 6,
        coverPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
        photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
        isOnline: true,
        rating: 5.0,
        totalChats: 203,
        tags: ['Extrovertida', 'Atenciosa', 'Engraçada']
      },
      {
        userId: modelUsers[2]._id,
        name: 'Camila Silva',
        bio: 'Olá! Adoro arte, música e conversas profundas. Me chama! ✨',
        age: 22,
        pricePerMessage: 5,
        coverPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
        isOnline: false,
        rating: 4.8,
        totalChats: 89,
        tags: ['Artística', 'Intelectual', 'Meiga']
      },
      {
        userId: modelUsers[3]._id,
        name: 'Fernanda Costa',
        bio: 'Oi amor! Sou alegre e adoro fazer as pessoas sorrirem. Vamos conversar? 🌟',
        age: 24,
        pricePerMessage: 7,
        coverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
        isOnline: true,
        rating: 4.9,
        totalChats: 178,
        tags: ['Alegre', 'Carismática', 'Sensual']
      },
      {
        userId: modelUsers[4]._id,
        name: 'Juliana Alves',
        bio: 'Hey! Adoro esportes, viagens e conhecer pessoas interessantes. Bora? 🔥',
        age: 26,
        pricePerMessage: 6,
        coverPhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
        photos: ['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
        isOnline: true,
        rating: 4.7,
        totalChats: 142,
        tags: ['Esportiva', 'Aventureira', 'Comunicativa']
      },
      {
        userId: modelUsers[5]._id,
        name: 'Gabriela Martins',
        bio: 'Oi querido! Sou doce e atenciosa. Vem conversar comigo! 💖',
        age: 21,
        pricePerMessage: 5,
        coverPhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
        photos: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'],
        isOnline: false,
        rating: 4.8,
        totalChats: 95,
        tags: ['Doce', 'Romântica', 'Gentil']
      },
      {
        userId: modelUsers[6]._id,
        name: 'Amanda Rodrigues',
        bio: 'Olá! Sou descontraída e adoro uma boa conversa. Me chama! 😊',
        age: 27,
        pricePerMessage: 8,
        coverPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
        isOnline: true,
        rating: 5.0,
        totalChats: 234,
        tags: ['Madura', 'Experiente', 'Sofisticada']
      },
      {
        userId: modelUsers[7]._id,
        name: 'Bianca Ferreira',
        bio: 'Hey! Sou criativa e adoro arte. Vamos trocar uma ideia? 🎨',
        age: 23,
        pricePerMessage: 6,
        coverPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
        photos: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400'],
        isOnline: false,
        rating: 4.6,
        totalChats: 67,
        tags: ['Criativa', 'Artística', 'Moderna']
      }
    ];

    await Model.insertMany(models);
    console.log('✨ Perfis de modelos criados');

    // Criar usuário teste
    await User.create({
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      cpf: '00000000000',
      phone: '11999999999',
      password: hashedPassword,
      role: 'user',
      credits: 0
    });
    console.log('👤 Usuário teste criado');

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📝 Credenciais para teste:');
    console.log('   Email: teste@exemplo.com');
    console.log('   Senha: 123456');
    console.log('   Créditos: 0 (compre créditos para testar)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

seedDatabase();

