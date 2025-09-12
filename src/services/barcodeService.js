const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

// Generar código de barras como imagen base64
const generateBarcodeImage = (barcode, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear canvas
      const canvas = createCanvas(400, 200);
      
      // Configuración del código de barras
      const barcodeOptions = {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        textMargin: 10,
        ...options
      };

      // Generar código de barras
      JsBarcode(canvas, barcode, barcodeOptions);
      
      // Convertir a base64
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
};

// Generar etiqueta completa con fechas opcionales
const generateProductLabel = async (product, dates = {}) => {
  try {
    const { elaborationDate, expirationDate } = dates;
    
    // Crear canvas más grande para incluir información adicional
    const canvas = createCanvas(400, 300);
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 300);
    
    // Configurar fuente
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    let yPosition = 25;
    
    // Nombre del producto
    ctx.fillText(product.name, 200, yPosition);
    yPosition += 25;
    
    // Precio
    if (product.price) {
      ctx.font = '14px Arial';
      ctx.fillText(`Precio: $${product.price.toLocaleString()}`, 200, yPosition);
      yPosition += 25;
    }
    
    // Fecha de elaboración
    if (elaborationDate) {
      ctx.font = '12px Arial';
      ctx.fillText(`Elaborado: ${elaborationDate}`, 200, yPosition);
      yPosition += 20;
    }
    
    // Fecha de vencimiento
    if (expirationDate) {
      ctx.font = '12px Arial';
      ctx.fillText(`Vence: ${expirationDate}`, 200, yPosition);
      yPosition += 25;
    }
    
    // Generar código de barras en la parte inferior
    const barcodeCanvas = createCanvas(350, 100);
    JsBarcode(barcodeCanvas, product.barcode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
      textMargin: 5
    });
    
    // Dibujar el código de barras en el canvas principal
    ctx.drawImage(barcodeCanvas, 25, yPosition);
    
    // Convertir a base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`Error generando etiqueta: ${error.message}`);
  }
};

// Validar formato de fecha
const isValidDate = (dateString) => {
  if (!dateString) return true; // Las fechas son opcionales
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  generateBarcodeImage,
  generateProductLabel,
  isValidDate
};
