import * as saleService from './sale.service.js';

// Obtener todas las ventas de una feria
export const getSalesByFair = async (req, res) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;

    if (!fairId) {
      return res.status(400).json({ 
        message: 'El ID de la feria es requerido' 
      });
    }

    const result = await saleService.getSalesByFair({ userId, fairId });
    res.json(result.sales);
  } catch (error) {
    console.error('Error en getSalesByFair:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas' 
    });
  }
};

// Obtener detalles de una venta específica
export const getSaleDetails = async (req, res) => {
  try {
    const { saleId } = req.params;
    const userId = req.user.id;

    if (!saleId) {
      return res.status(400).json({ 
        message: 'El ID de la venta es requerido' 
      });
    }

    const result = await saleService.getSaleDetails({ userId, saleId });
    res.json(result);
  } catch (error) {
    console.error('Error en getSaleDetails:', error);
    
    if (error.message === 'Venta no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error al obtener los detalles de la venta' 
    });
  }
};

// Crear una nueva venta
export const createSale = async (req, res) => {
  try {
    const { fairId, items, paymentMethod, notes } = req.body;
    const userId = req.user.id;

    // Validaciones básicas
    if (!fairId) {
      return res.status(400).json({ 
        message: 'El ID de la feria es requerido' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Se requiere al menos un item para la venta' 
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({ 
        message: 'El método de pago es requerido' 
      });
    }

    const validPaymentMethods = ['cash', 'transfer', 'card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        message: 'Método de pago no válido' 
      });
    }

    // Validar estructura de items
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ 
          message: 'Todos los items deben tener productId, quantity y unitPrice' 
        });
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ 
          message: 'La cantidad debe ser un número mayor a 0' 
        });
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        return res.status(400).json({ 
          message: 'El precio unitario debe ser un número no negativo' 
        });
      }
    }

    const saleData = { fairId, items, paymentMethod, notes };
    const result = await saleService.createSale({ userId, saleData });

    res.status(201).json({
      message: result.message,
      sale: result.sale
    });

  } catch (error) {
    console.error('Error en createSale:', error);
    
    // Manejo de errores específicos de negocio
    if (error.message.includes('no encontrada') || 
        error.message.includes('no encontrado') ||
        error.message.includes('requerido') ||
        error.message.includes('debe ser') ||
        error.message.includes('no válido')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error al crear la venta' 
    });
  }
};

// Buscar productos por nombre o código de barras
export const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    if (!search) {
      return res.json([]);
    }

    if (search.length < 2) {
      return res.status(400).json({ 
        message: 'El término de búsqueda debe tener al menos 2 caracteres' 
      });
    }

    const result = await saleService.searchProducts({ userId, search });
    res.json(result.products);
  } catch (error) {
    console.error('Error en searchProducts:', error);
    res.status(500).json({ 
      message: 'Error al buscar productos' 
    });
  }
};

// Obtener estadísticas de ventas de una feria
export const getFairSalesStats = async (req, res) => {
  try {
    const { fairId } = req.params;
    const userId = req.user.id;

    if (!fairId) {
      return res.status(400).json({ 
        message: 'El ID de la feria es requerido' 
      });
    }

    const result = await saleService.getFairSalesStats({ userId, fairId });
    res.json(result);
  } catch (error) {
    console.error('Error en getFairSalesStats:', error);
    
    if (error.message === 'Feria no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error al obtener las estadísticas' 
    });
  }
};

// Procesar imagen de código de barras (placeholder para futuro)
export const processBarcodeImage = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        message: 'Los datos de la imagen son requeridos' 
      });
    }

    const result = await saleService.processBarcodeImage({ imageData });
    res.json(result);
  } catch (error) {
    console.error('Error en processBarcodeImage:', error);
    res.status(500).json({ 
      message: 'Error al procesar la imagen' 
    });
  }
};

// Obtener estadísticas generales para el dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await saleService.getDashboardStats({ userId });
    res.json(result);
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({ 
      message: 'Error al obtener las estadísticas' 
    });
  }
};
