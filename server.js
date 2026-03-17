// -------------------- IMPORTAR DEPENDENCIAS --------------------
const express = require('express');
const path = require('path');
// Eliminamos 'fs' para usuarios porque ahora usamos la BD
const rutasUsuarios = require('./routes/usuarios');
const db = require('./data/db'); 
const multer = require('multer');

const app = express();
const PORT = 3650;

// Configuración de almacenamiento para fotos de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
    },
    filename: (req, file, cb) => {
        // Guardamos la foto con el nombre: perfil-ID-Fecha.jpg
        cb(null, `perfil-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage }); // AQUÍ SE DEFINE LA VARIABLE 'upload'

// Verificar conexión a MySQL al iniciar
db.query('SELECT 1')
    .then(() => console.log('✅ Conexión a MySQL exitosa (Appiu DB)'))
    .catch(err => console.error('❌ Error en MySQL:', err.message));

// -------------------- MIDDLEWARE --------------------
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// -------------------- VISTAS --------------------
app.get('/', (req, res) => {
  // Ajustado a la ruta de tu repositorio
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// -------------------- API REST: USUARIOS (CONECTADO A BD) --------------------

// Usamos el archivo de rutas que ya configuramos con MySQL
app.use('/auth', rutasUsuarios);

app.use('/api/publicaciones', require('./routes/publicaciones'));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// -------------------- API REST: PUBLICACIONES (POR IMPLEMENTAR EN BD) --------------------

// Nota: He mantenido estas rutas pero deberíamos moverlas a /routes/posts.js 
// para seguir usando MySQL en lugar de publicaciones.json pronto.
app.get('/api/publicaciones', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener todos los usuarios (Sugerencias)
app.get('/api/usuarios', async (req, res) => {
    try {
        // Traemos todos los usuarios de la base de datos
        const [rows] = await db.query('SELECT id, username FROM users'); 
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al cargar sugerencias" });
    }
});

// Ruta para procesar el seguimiento
app.post('/api/usuarios/follow', async (req, res) => {
    const { seguidor_id, seguido_id } = req.body;
    try {
        const [existe] = await db.query('SELECT * FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?', [seguidor_id, seguido_id]);
        
        if (existe.length > 0) {
            await db.query('DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?', [seguidor_id, seguido_id]);
            res.json({ action: 'unfollowed' });
        } else {
            await db.query('INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)', [seguidor_id, seguido_id]);
            res.json({ action: 'followed' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Ruta para editar perfil y subir foto
app.post('/api/usuarios/editar', upload.single('foto'), async (req, res) => {
    const { id, nombre } = req.body;
    let fotoUrl = null;

    try {
        if (req.file) {
            fotoUrl = `/uploads/${req.file.filename}`;
            await db.query('UPDATE users SET nombre_completo = ?, foto_perfil = ? WHERE id = ?', [nombre, fotoUrl, id]);
        } else {
            await db.query('UPDATE users SET nombre_completo = ? WHERE id = ?', [nombre, id]);
        }
        res.json({ success: true, foto_url: fotoUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// La ruta de contadores que ya tenías (ASEGÚRATE QUE ESTÉ EN server.js, NO EN EL HTML)
app.get('/api/usuarios/contadores/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const [seguidores] = await db.query('SELECT COUNT(*) as total FROM seguidores WHERE seguido_id = ?', [userId]);
        const [seguidos] = await db.query('SELECT COUNT(*) as total FROM seguidores WHERE seguidor_id = ?', [userId]);
        res.json({ seguidores: seguidores[0].total, seguidos: seguidos[0].total });
    } catch (e) { res.status(500).json(e); }
});


// -------------------- INICIAR SERVIDOR --------------------
app.listen(PORT, () => {
  console.log(`✅ Servidor de Appiu corriendo en: http://localhost:${PORT}`);
});