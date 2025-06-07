router.get('/status', authenticateToken, async (req, res) => {
  try {
    const onlineCouriers = await Courier.countDocuments({ status: 'online' });
    const acceptanceTime = '~4 min'; // Substitua por lógica real se disponível
    const systemStatus = onlineCouriers > 0 ? 'Operacional' : 'Indisponível';

    res.status(200).json({
      onlineCouriers,
      acceptanceTime,
      systemStatus,
    });
  } catch (error) {
    console.error('Erro ao buscar status do sistema:', error);
    res.status(500).json({ message: 'Erro ao buscar status do sistema', error });
  }
});