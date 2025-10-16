import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Gerar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, cpf, phone, password } = req.body;

    // Validações
    if (!name || !email || !cpf || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos.'
      });
    }

    // Verificar se usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado.'
      });
    }

    // Verificar se CPF já existe
    const cpfExists = await User.findOne({ cpf });
    if (cpfExists) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado.'
      });
    }

    // Processar telefone - remover 9º dígito se não for DDD de SP
    let processedPhone = phone.replace(/\D/g, ''); // Remove tudo que não é número
    const ddd = parseInt(processedPhone.substring(0, 2));
    
    // DDDs de São Paulo: 11-19
    const spDDDs = [11, 12, 13, 14, 15, 16, 17, 18, 19];
    
    if (processedPhone.length === 11 && !spDDDs.includes(ddd)) {
      // Remove o primeiro 9 (9º dígito) para DDDs fora de SP
      processedPhone = processedPhone.substring(0, 2) + processedPhone.substring(3);
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const user = await User.create({
      name,
      email,
      cpf: cpf.replace(/\D/g, ''), // Salvar CPF apenas com números
      phone: processedPhone,
      password: hashedPassword,
      credits: 0 // Usuários começam sem créditos
    });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário.',
      error: error.message
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos.'
      });
    }

    // Verificar se usuário existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verificar se está ativo
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Conta desativada.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role,
          avatar: user.avatar
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login.',
      error: error.message
    });
  }
};

// @desc    Obter dados do usuário logado
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do usuário.',
      error: error.message
    });
  }
};

