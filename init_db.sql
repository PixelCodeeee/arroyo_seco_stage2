-- Database Initialization Script for Arroyo Seco
-- This script creates tables in the correct dependency order to avoid Foreign Key errors.

CREATE DATABASE IF NOT EXISTS arroyo_seco;
USE arroyo_seco;

-- 1. Users (No dependencies)
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('turista', 'oferente', 'admin') NOT NULL DEFAULT 'turista',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    esta_activo BOOLEAN DEFAULT TRUE
);

-- 2. 2FA Codes (Depends on usuario)
CREATE TABLE IF NOT EXISTS codigo_2fa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 3. Categories (No dependencies)
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('gastronomica', 'artesanal') NOT NULL
);

-- 4. Oferentes (Depends on usuario)
CREATE TABLE IF NOT EXISTS oferente (
    id_oferente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_negocio VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    tipo ENUM('restaurante', 'artesanal') NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'suspendido') DEFAULT 'pendiente',
    horario_disponibilidad JSON,
    imagen VARCHAR(255),
    telefono VARCHAR(20),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 5. Restaurant Services (Depends on oferente)
CREATE TABLE IF NOT EXISTS servicio_restaurante (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    id_oferente INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    rango_precio VARCHAR(50),
    capacidad INT,
    estatus BOOLEAN DEFAULT TRUE,
    imagenes JSON,
    FOREIGN KEY (id_oferente) REFERENCES oferente(id_oferente) ON DELETE CASCADE
);

-- 6. Products (Depends on oferente, categoria - nullable)
CREATE TABLE IF NOT EXISTS producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_oferente INT NOT NULL,
    id_categoria INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    inventario INT DEFAULT 0,
    imagenes JSON,
    estatus BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_oferente) REFERENCES oferente(id_oferente) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE SET NULL
);

-- 7. Orders (Depends on usuario)
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'pagado', 'enviado', 'completado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 8. Order Items (Depends on pedido, producto)
CREATE TABLE IF NOT EXISTS item_pedido (
    id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_compra DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- 9. Cart (Depends on usuario, producto)
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE
);

-- 10. Reservations (Depends on usuario, servicio_restaurante)
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_servicio INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    numero_personas INT NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicio_restaurante(id_servicio) ON DELETE CASCADE
);

SELECT 'Database initialization completed successfully.' as status;
