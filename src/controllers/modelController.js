import Model from '../models/Model.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Listar todas as modelos
// @route   GET /api/models
// @access  Public
export const getModels = async (req, res) => {
  try {
    const { online, page = 1, limit = 12, userId } = req.query;
    
    const query = {};
    if (online === 'true') {
      query.isOnline = true;
    }
    if (userId) {
      // Validar se é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuário inválido'
        });
      }
      query.userId = userId;
    }

    const models = await Model.find(query)
      .populate('userId', 'name email')
      .sort({ isOnline: -1, rating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Model.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        models,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar modelos.',
      error: error.message
    });
  }
};

// @desc    Obter detalhes de uma modelo
// @route   GET /api/models/:id
// @access  Public
export const getModelById = async (req, res) => {
  try {
    const model = await Model.findById(req.params.id)
      .populate('userId', 'name email avatar');

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrada.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        model
      }
    });
  } catch (error) {
    console.error('Erro ao obter modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter modelo.',
      error: error.message
    });
  }
};

// @desc    Criar perfil de modelo (apenas para usuários com role 'model')
// @route   POST /api/models
// @access  Private (Model)
export const createModel = async (req, res) => {
  try {
    const { name, bio, age, pricePerMessage, coverPhoto, photos, tags } = req.body;

    // Verificar se já existe um perfil de modelo para este usuário
    const existingModel = await Model.findOne({ userId: req.userId });
    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui um perfil de modelo.'
      });
    }

    const model = await Model.create({
      userId: req.userId,
      name,
      bio,
      age,
      pricePerMessage,
      coverPhoto,
      photos,
      tags
    });

    res.status(201).json({
      success: true,
      message: 'Perfil de modelo criado com sucesso!',
      data: {
        model
      }
    });
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar perfil de modelo.',
      error: error.message
    });
  }
};

// @desc    Atualizar status online da modelo
// @route   PATCH /api/models/:id/status
// @access  Private (Model)
export const updateModelStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    const model = await Model.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrada ou você não tem permissão.'
      });
    }

    model.isOnline = isOnline;
    await model.save();

    res.status(200).json({
      success: true,
      message: 'Status atualizado com sucesso!',
      data: {
        model
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status.',
      error: error.message
    });
  }
};

