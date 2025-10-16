import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// Pacotes de créditos disponíveis
const creditPackages = [
  { credits: 50, price: 19.90, bonus: 0 },
  { credits: 100, price: 34.90, bonus: 10 },
  { credits: 250, price: 79.90, bonus: 50 },
  { credits: 500, price: 149.90, bonus: 100 }
];

// @desc    Listar pacotes de créditos disponíveis
// @route   GET /api/credits/packages
// @access  Public
export const getCreditPackages = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        packages: creditPackages
      }
    });
  } catch (error) {
    console.error('Erro ao listar pacotes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pacotes de créditos.',
      error: error.message
    });
  }
};

// @desc    Criar transação de compra de créditos
// @route   POST /api/credits/purchase
// @access  Private
export const purchaseCredits = async (req, res) => {
  try {
    const { packageIndex, paymentMethod } = req.body;

    // Validações
    if (packageIndex === undefined || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos.'
      });
    }

    const selectedPackage = creditPackages[packageIndex];
    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'Pacote inválido.'
      });
    }

    const totalCredits = selectedPackage.credits + selectedPackage.bonus;

    // Criar transação
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'purchase',
      amount: selectedPackage.price,
      credits: totalCredits,
      status: 'pending',
      paymentMethod,
      description: `Compra de ${totalCredits} créditos`,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase()
    });

    // Mock: Simular aprovação automática (em produção, isso viria do webhook)
    // Você pode comentar isso e processar via webhook
    setTimeout(async () => {
      try {
        transaction.status = 'completed';
        await transaction.save();

        const user = await User.findById(req.userId);
        user.credits += totalCredits;
        await user.save();
      } catch (err) {
        console.error('Erro ao processar transação mock:', err);
      }
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Transação criada! Aguardando confirmação de pagamento.',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Erro ao comprar créditos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar compra.',
      error: error.message
    });
  }
};

// @desc    Obter histórico de transações do usuário
// @route   GET /api/credits/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments({ userId: req.userId });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar transações.',
      error: error.message
    });
  }
};

// @desc    Obter saldo de créditos do usuário
// @route   GET /api/credits/balance
// @access  Private
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.status(200).json({
      success: true,
      data: {
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter saldo.',
      error: error.message
    });
  }
};

