// -------------------- IMPORTAR DEPENDENCIAS --------------------
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3650;

// -------------------- MIDDLEWARE --------------------
app.use(express.json()); // Para manejar JSON en requests
app.use(express.static(path.join(__dirname, 'public'))); // Archivos estáticos

// -------------------- VISTAS --------------------
// Ruta principal -> redirige a registro.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// -------------------- API REST: PRODUCTOS --------------------

// Obtener todos los productos (GET)
app.get('/api/productos', (req, res) => {
  const productos = JSON.parse(fs.readFileSync('./data/productos.json', 'utf8'));
  res.json(productos);
});

// Registrar un nuevo producto (POST)
app.post('/api/productos', (req, res) => {
  const productos = JSON.parse(fs.readFileSync('./data/productos.json', 'utf8'));
  const nuevoProducto = {
    id: productos.length + 1,
    nombre: req.body.nombre,
    precio: req.body.precio,
    cantidad: req.body.cantidad
  };
  productos.push(nuevoProducto);
  fs.writeFileSync('./data/productos.json', JSON.stringify(productos, null, 2));
  res.status(201).json(nuevoProducto);
});

// Actualizar un producto (PATCH)
app.patch('/api/productos/:id', (req, res) => {
  let productos = JSON.parse(fs.readFileSync('./data/productos.json', 'utf8'));
  const productoId = parseInt(req.params.id);
  const producto = productos.find(p => p.id === productoId);

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  if (req.body.nombre) producto.nombre = req.body.nombre;
  if (req.body.precio) producto.precio = req.body.precio;
  if (req.body.cantidad) producto.cantidad = req.body.cantidad;

  fs.writeFileSync('./data/productos.json', JSON.stringify(productos, null, 2));
  res.json(producto);
});

// Eliminar un producto (DELETE)
app.delete('/api/productos/:id', (req, res) => {
  let productos = JSON.parse(fs.readFileSync('./data/productos.json', 'utf8'));
  const productoId = parseInt(req.params.id);
  const nuevosProductos = productos.filter(p => p.id !== productoId);

  if (productos.length === nuevosProductos.length) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  fs.writeFileSync('./data/productos.json', JSON.stringify(nuevosProductos, null, 2));
  res.json({ mensaje: "Producto eliminado con éxito" });
});

// -------------------- API REST: USUARIOS --------------------

// Registrar usuario (POST)
app.post('/api/usuarios', (req, res) => {
  const usuarios = JSON.parse(fs.readFileSync('./data/usuarios.json', 'utf8'));
  const nuevoUsuario = {
    id: usuarios.length + 1,
    username: req.body.username,
    password: req.body.password
  };
  usuarios.push(nuevoUsuario);
  fs.writeFileSync('./data/usuarios.json', JSON.stringify(usuarios, null, 2));
  res.status(201).json({ success: true, mensaje: "Usuario registrado con éxito" });
});

// Consultar usuarios (GET)
app.get('/api/usuarios', (req, res) => {
  const usuarios = JSON.parse(fs.readFileSync('./data/usuarios.json', 'utf8'));
  res.json(usuarios);
});

// Login de usuario (POST)
app.post('/api/login', (req, res) => {
  const usuarios = JSON.parse(fs.readFileSync('./data/usuarios.json', 'utf8'));
  const { username, password } = req.body;

  const user = usuarios.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({ success: true, mensaje: 'Login exitoso', user });
  } else {
    res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
  }
});

// Obtener publicaciones
app.get('/api/publicaciones', (req, res) => {
  const publicaciones = JSON.parse(fs.readFileSync('./data/publicaciones.json', 'utf8'));
  res.json(publicaciones);
});

// Crear publicación
app.post('/api/publicaciones', (req, res) => {

  const publicaciones = JSON.parse(fs.readFileSync('./data/publicaciones.json', 'utf8'));

  const nueva = {
    id: publicaciones.length + 1,
    usuario: req.body.usuario,
    titulo: req.body.titulo,
    descripcion: req.body.descripcion,
    imagen: req.body.imagen || "https://images.unsplash.com/photo-1501004318641-b39e6451bec6"
  };

  publicaciones.push(nueva);

  fs.writeFileSync('./data/publicaciones.json', JSON.stringify(publicaciones,null,2));

  res.status(201).json(nueva);

});

// -------------------- INICIAR SERVIDOR --------------------
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});
