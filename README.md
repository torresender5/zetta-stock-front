# zettastock

Sistema de gestión empresarial (facturación e inventario) para pequeños negocios. Permite administrar productos, clientes, proveedores, compras, ventas, facturación y cuentas por pagar/cobrar desde una interfaz web.

Desarrollado con **React 19**, **TypeScript 5** y **Vite 7**.

## Funcionalidades

### Dashboard
- KPIs en tiempo real: productos, clientes, compras, ventas, facturas pendientes y stock bajo.
- Gráfico de ventas (Recharts) agrupado por día, semana o mes.
- Accesos directos a los módulos principales.

### Productos
- CRUD completo con código, SKU, tipo, categoría, descripción e imagen.
- Precios de compra y venta por producto.
- Control de stock general y stock por talla (`sizes`).
- Búsqueda por nombre, filtro por categoría y paginación del lado del servidor.

### Clientes
- CRUD con datos de contacto y documento (NIT o cédula).

### Proveedores
- CRUD con datos de contacto y documento (NIT o cédula).

### Compras
- Registro de compras a proveedores con múltiples ítems.
- Estado de pago: `pagado` / `pendiente`.
- Actualización del estado de pago (alimenta cuentas por pagar).

### Ventas
- Flujo de venta con carrito de compras (`CartPanel`): agregar, actualizar cantidad y quitar productos.
- Cálculo automático de subtotal, IVA (19%) y total.
- Selección de cliente y estado de pago.
- Al registrar la venta se genera automáticamente su factura.

### Facturas
- Generadas junto a cada venta, con numeración (`FAC-AAAA-XXXX`), datos del cliente e ítems.
- Listado y cambio de estado (`pagada` / `pendiente`).

### Cuentas por Pagar / Cobrar
- Seguimiento de compras y ventas según su estado de pago.

### Usuarios
- Gestión de usuarios del sistema: listado, edición y eliminación.

### Autenticación
- Inicio de sesión y registro de usuarios (JWT).
- Rutas protegidas mediante `ProtectedRoute`.

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| React 19 | Framework UI (solo hooks + function components) |
| TypeScript 5 | Tipado estático (modo strict) |
| Vite 7 | Bundler y servidor de desarrollo |
| Tailwind CSS 4 | Estilos utilitarios (config vía CSS, sin archivo de config) |
| Zustand 5 | Manejo de estado global |
| React Router 7 | Enrutamiento |
| Zod 4 + React Hook Form 7 | Validación de formularios |
| Axios | Cliente HTTP |
| Recharts | Gráficos del dashboard |
| Lucide React | Iconografía |

## Requisitos Previos

- **Node.js 18+** y npm.
- **Backend API** corriendo (por defecto se espera en `http://localhost:3000`, configurable).

## Ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd zetta-stock-front
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000/
```

> Si no se define `VITE_API_URL`, se usa `http://localhost:3000/` por defecto.

### 4. Iniciar el backend API

El frontend espera una API que exponga los endpoints listados [más abajo](#endpoints-del-api). Por defecto debe estar disponible en `http://localhost:3000`.

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**. Al primer acceso será necesario iniciar sesión o registrarse en `/register`.

### Producción

```bash
# Compila (type-check con tsc -b + build con Vite), genera la carpeta dist/
npm run build

# Sirve el build de producción localmente
npm run preview
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Type-check (`tsc -b`) + build de producción |
| `npm run preview` | Previsualiza el build de producción |

## Arquitectura

Flujo de datos: **Página → Store (Zustand) → Service (Axios) → API**

- **Stores** (`src/stores/`): estado global por dominio (`productStore`, `saleStore`, `cartStore`, `authStore`, etc.). Los errores se guardan en el estado (`error`), no se lanzan excepciones; los métodos que pueden fallar retornan `{ ok, error? }`.
- **Services** (`src/services/`): encapsulan las llamadas HTTP y exponen DTOs para creación/actualización (`CreateProductDto`, `CreateSaleDto`, etc.).
- **Cliente HTTP** (`src/lib/api.ts`): instancia de Axios con:
  - Interceptor de request: agrega `Authorization: Bearer <token>` desde `localStorage` (`auth-token`).
  - Interceptor de response: ante un `401` limpia el token, resetea la sesión y redirige a `/login`.
- **Autenticación**: el token JWT se guarda en `localStorage` como `auth-token`; los datos del usuario (`sub`, `name`, `email`) se decodifican del payload del token.
- **Tipos** (`src/types/index.ts`): interfaces compartidas (`Product`, `Sale`, `Invoice`, respuestas paginadas, etc.).

## Estructura del Proyecto

```
src/
├── components/
│   ├── DataTable/         # Tabla de datos reutilizable
│   ├── CartPanel.tsx      # Panel del carrito de ventas
│   ├── Layout.tsx         # Layout principal (sidebar + contenido)
│   ├── Modal.tsx          # Modal genérico
│   ├── ProtectedRoute.tsx # Guarda de rutas autenticadas
│   └── Sidebar.tsx        # Navegación lateral
├── pages/                 # Páginas de rutas (Dashboard, Products, Sales, ...)
├── stores/                # Stores de Zustand (product, cart, client, sale, purchase, supplier, auth)
├── services/              # Servicios de API (auth, product, client, supplier, purchase, sale/invoice)
├── types/
│   └── index.ts           # Interfaces y tipos TypeScript
├── lib/
│   ├── api.ts             # Instancia Axios + interceptores
│   └── utils.ts           # Formatters (COP, fechas), TAX_RATE (IVA 19%), categorías
├── App.tsx                # Componente raíz con definición de rutas
└── main.tsx               # Punto de entrada
```

## Rutas de la Aplicación

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro de usuarios |

### Protegidas (requieren autenticación)

| Ruta | Módulo |
|------|--------|
| `/` | Dashboard |
| `/products` | Gestión de productos |
| `/clients` | Gestión de clientes |
| `/suppliers` | Gestión de proveedores |
| `/purchases` | Compras |
| `/sales` | Ventas |
| `/invoices` | Facturas |
| `/accounts-payable` | Cuentas por pagar |
| `/accounts-receivable` | Cuentas por cobrar |
| `/users` | Gestión de usuarios |

## Convenciones

- Moneda: pesos colombianos (**COP**) con formato local `es-CO` (sin decimales).
- Fechas formateadas con locale `es-CO`.
- Textos de UI y comentarios del código en español.
- Categorías de producto predefinidas: Electrónica, Ropa, Alimentos, Hogar, Salud, Deportes, Belleza, Otros.
