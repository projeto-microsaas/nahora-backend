const express = require('express');
const router = express.Router();
const Address = require('../models/Address');

// ======================
// GET /api/addresses (listar endereços do comerciante)
// ======================
router.get('/', async (req, res) => {
  try {
    const addresses = await Address.find({ merchantId: req.user.id })
      .sort({ isDefault: -1, createdAt: -1 }); // Padrão primeiro, depois por data
    
    res.json({ addresses });
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    res.status(500).json({ message: 'Erro ao buscar endereços', error: error.message });
  }
});

// ======================
// POST /api/addresses (criar novo endereço)
// ======================
router.post('/', async (req, res) => {
  try {
    const { type, street, number, neighborhood, city, state, zipCode, complement, isDefault } = req.body;

    // Validações básicas
    if (!type || !street || !number || !neighborhood || !city || !state) {
      return res.status(400).json({ message: 'Tipo, rua, número, bairro, cidade e estado são obrigatórios' });
    }

    // Se for definir como padrão, remover padrão anterior do mesmo tipo
    if (isDefault) {
      await Address.updateMany(
        { merchantId: req.user.id, type, isDefault: true },
        { isDefault: false }
      );
    }

    const newAddress = new Address({
      type,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      complement,
      isDefault: isDefault || false,
      merchantId: req.user.id
    });

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ message: 'Erro ao criar endereço', error: error.message });
  }
});

// ======================
// PUT /api/addresses/:id (atualizar endereço)
// ======================
router.put('/:id', async (req, res) => {
  try {
    const { type, street, number, neighborhood, city, state, zipCode, complement, isDefault } = req.body;
    const addressId = req.params.id;

    // Verificar se o endereço pertence ao comerciante
    const existingAddress = await Address.findOne({ 
      _id: addressId, 
      merchantId: req.user.id 
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    // Se for definir como padrão, remover padrão anterior do mesmo tipo
    if (isDefault && !existingAddress.isDefault) {
      await Address.updateMany(
        { merchantId: req.user.id, type: type || existingAddress.type, isDefault: true },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        type: type || existingAddress.type,
        street: street || existingAddress.street,
        number: number || existingAddress.number,
        neighborhood: neighborhood || existingAddress.neighborhood,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        zipCode: zipCode !== undefined ? zipCode : existingAddress.zipCode,
        complement: complement !== undefined ? complement : existingAddress.complement,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      },
      { new: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ message: 'Erro ao atualizar endereço', error: error.message });
  }
});

// ======================
// DELETE /api/addresses/:id (deletar endereço)
// ======================
router.delete('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;

    // Verificar se o endereço pertence ao comerciante
    const address = await Address.findOne({ 
      _id: addressId, 
      merchantId: req.user.id 
    });

    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    await Address.findByIdAndDelete(addressId);
    res.json({ message: 'Endereço removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ message: 'Erro ao deletar endereço', error: error.message });
  }
});

// ======================
// PUT /api/addresses/:id/set-default (definir como padrão)
// ======================
router.put('/:id/set-default', async (req, res) => {
  try {
    const addressId = req.params.id;

    // Verificar se o endereço pertence ao comerciante
    const address = await Address.findOne({ 
      _id: addressId, 
      merchantId: req.user.id 
    });

    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    // Remover padrão anterior
    await Address.updateMany(
      { merchantId: req.user.id, isDefault: true },
      { isDefault: false }
    );

    // Definir novo padrão
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { isDefault: true },
      { new: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error('Erro ao definir endereço padrão:', error);
    res.status(500).json({ message: 'Erro ao definir endereço padrão', error: error.message });
  }
});

module.exports = router;
