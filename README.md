# Ferias Backend API

API para gestión de ferias, productos y ventas desarrollada con Node.js y Express.

## 🚀 Características

- **Autenticación híbrida**: JWT y OAuth (Google, Facebook, Apple)
- **Gestión de productos**: CRUD completo con categorías
- **Sistema de ventas**: Registro de ventas con múltiples items
- **Reportes**: Estadísticas y reportes de ventas por feria/fecha
- **Códigos de barras**: Generación de códigos de barras para productos
- **Multi-moneda**: Soporte para múltiples monedas
- **Documentación**: API documentada con Swagger/OpenAPI

## 📋 Requisitos

- Node.js >= 16
- PostgreSQL
- npm o yarn

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone [repository-url]
cd ferias_backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Configurar base de datos:
```bash
# Crear la base de datos y ejecutar migraciones
npm run migrate
```

5. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Documentación de la API

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación interactiva de la API en:

**🔗 [http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

La documentación incluye:
- Todos los endpoints disponibles
- Esquemas de request/response
- Ejemplos de uso
- Autenticación requerida
- Códigos de error

## 🔑 Autenticación

La API soporta dos métodos de autenticación:

### 1. JWT Token (Bearer)
```bash
# Incluir en el header
Authorization: Bearer <your-jwt-token>
```

### 2. Sesión (Cookies)
```bash
# Automático después del login
# Cookie: connect.sid=<session-id>
```

## 📁 Estructura de Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registro de usuario
- `GET /api/v1/auth/google` - Login con Google
- `GET /api/v1/auth/facebook` - Login con Facebook

### Productos
- `GET /api/v1/products` - Listar productos
- `POST /api/v1/products` - Crear producto
- `GET /api/v1/products/:id` - Obtener producto
- `PUT /api/v1/products/:id` - Actualizar producto
- `DELETE /api/v1/products/:id` - Eliminar producto

### Ventas
- `GET /api/v1/sales/fair/:fairId` - Ventas por feria
- `POST /api/v1/sales` - Crear venta
- `GET /api/v1/sales/:id` - Detalle de venta

### Ferias
- `GET /api/v1/fairs` - Listar ferias
- `POST /api/v1/fairs` - Crear feria
- `GET /api/v1/fairs/:id` - Obtener feria
- `PUT /api/v1/fairs/:id` - Actualizar feria

### Reportes
- `GET /api/v1/reports/fair/:fairId/daily` - Reporte diario
- `GET /api/v1/reports/fair/:fairId/date/:date` - Reporte por fecha

### Usuario
- `GET /api/v1/user/profile` - Perfil del usuario
- `PUT /api/v1/user/profile` - Actualizar perfil
- `GET /api/v1/user/currency` - Moneda preferida
- `PUT /api/v1/user/currency` - Cambiar moneda

## 💡 Ejemplos de Uso

### Crear un producto
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Producto de ejemplo",
    "description": "Descripción del producto",
    "manufacturing_cost": 10.50,
    "final_price": 25.00,
    "stock": 100
  }'
```

### Registrar una venta
```bash
curl -X POST http://localhost:3000/api/v1/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "fairId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 25.00,
        "discount": 0
      }
    ],
    "paymentMethod": "cash"
  }'
```

## 🔒 Seguridad

- Rate limiting: 100 requests por 15 minutos
- Helmet.js para headers de seguridad
- Validación de datos con Joi
- Autenticación requerida para todos los endpoints protegidos
- Sanitización de inputs

## 🐛 Manejo de Errores

La API retorna errores en formato estándar:

```json
{
  "error": "Bad Request",
  "message": "Descripción detallada del error",
  "statusCode": 400
}
```

### Códigos de Estado Comunes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: support@ferias.com
- Documentación completa: `/api/docs`

---

**Versión**: 1.0.0  
**Última actualización**: Septiembre 2024