// ciber-shop — servidor de demo para clase
// Este codigo contiene vulnerabilidades DELIBERADAS con fines didacticos.
// No desplegar nunca fuera del laboratorio.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const _ = require('lodash');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'changeme_clave_super_secreta_123';
const API_KEY = 'api_pagos_51H8xQ2eZvKYlo2C9XaBcDeF';
const DB_PASSWORD = 'SysAdmin2024!';

const USUARIOS = [
  { id: 1, email: 'ana@demo.es', password: '123456', nombre: 'Ana' }
];

function hashMal(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

app.get('/', (req, res) => {
  res.send(`<h1>ciber-shop (app de demo para clase)</h1>
    <ul>
      <li><a href="/saludo?name=Alumno">Saludo personalizado</a></li>
      <li><a href="/fichero?ruta=docs/nota.txt">Descargar una nota</a></li>
      <li><a href="/calc?expr=2*21">Calculadora de pruebas</a></li>
      <li><a href="/ping?host=localhost">Comprobar estado del servidor</a></li>
      <li><a href="/login?email=ana@demo.es&password=123456">Entrar</a></li>
      <li><a href="/buscar?q=promo">Buscar productos</a></li>
    </ul>`);
});

app.get('/saludo', (req, res) => {
  res.send('<h2>Hola, ' + req.query.name + '</h2>');
});

app.get('/fichero', (req, res) => {
  const ruta = req.query.ruta || 'docs/nota.txt';
  try {
    res.type('text/plain').send(fs.readFileSync(path.join(__dirname, ruta)));
  } catch (e) {
    res.status(404).send('No encontrado');
  }
});

app.get('/calc', (req, res) => {
  const expr = req.query.expr || '1+1';
  try {
    res.send('<h2>Resultado: ' + eval(expr) + '</h2>');
  } catch (e) {
    res.status(400).send('Expresion invalida');
  }
});

app.get('/ping', (req, res) => {
  const host = req.query.host || 'localhost';
  exec('ping -n 1 ' + host, (err, stdout) => {
    if (err) {
      res.status(500).type('text/plain').send('El host no responde');
    } else {
      res.type('text/plain').send(stdout);
    }
  });
});

app.get('/login', (req, res) => {
  const email = req.query.email || '';
  const password = req.query.password || '';
  const u = USUARIOS.find(x => x.email === email && x.password === password);
  if (!u) {
    return res.status(401).send('Credenciales incorrectas');
  }
  const token = jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { algorithm: 'HS256' });
  res.json({ token: token, hashGuardadoAntiguo: hashMal(password) });
});

app.get('/perfil', (req, res) => {
  const token = req.query.token || '';
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.id, email: payload.email });
  } catch (e) {
    res.status(401).send('Token invalido');
  }
});

app.get('/buscar', (req, res) => {
  const q = req.query.q || '';
  const productos = [
    { id: 1, nombre: 'Teclado mecánico', tag: 'perifericos' },
    { id: 2, nombre: 'Monitor 27"', tag: 'pantallas' },
    { id: 3, nombre: 'Pack promo ratón + alfombrilla', tag: 'promo' }
  ];
  const resultados = _.filter(productos, p =>
    p.nombre.toLowerCase().includes(q.toLowerCase()) || p.tag.includes(q.toLowerCase())
  );
  res.json({ query: q, resultados: resultados });
});

app.listen(PORT, () => {
  console.log(`ciber-shop escuchando en http://localhost:${PORT}`);
});
