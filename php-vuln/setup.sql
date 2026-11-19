-- setup.sql — base de datos para la app php-vuln (XAMPP / MariaDB, root sin contraseña)
-- Importar con phpMyAdmin o:  mysql -u root < setup.sql

CREATE DATABASE IF NOT EXISTS ciber CHARACTER SET utf8mb4;

USE ciber;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  nombre VARCHAR(80) NOT NULL
);

-- Usuario de prueba (credenciales de laboratorio, por eso se guardan en claro)
INSERT INTO usuarios (email, password, nombre)
VALUES ('ana@demo.es', '123456', 'Ana');
