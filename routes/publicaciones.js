const express = require('express');
const router = express.Router();
const db = require('../data/db'); 
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: 'public/uploads/', 
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 1. Ruta para OBTENER todas las publicaciones
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Ruta para CREAR publicación
router.post('/crear', upload.single('image'), async (req, res) => {
    try {
        const { user_id, username, content, plant_name } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const query = 'INSERT INTO posts (user_id, username, content, plant_name, image_url) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [user_id, username, content, plant_name, image_url]);

        res.status(201).json({ success: true, message: "Publicación creada con éxito" });
    } catch (error) {
        console.error("Error en servidor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Ruta para LIKES
router.post('/:id/like', async (req, res) => {
    const postId = req.params.id;
    const { user_id } = req.body;

    try {
        const [existe] = await db.query(
            'SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?', 
            [user_id, postId]
        );

        if (existe.length > 0) {
            await db.query('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, postId]);
            await db.query('UPDATE posts SET likes = likes - 1 WHERE id = ?', [postId]);
            res.json({ success: true, action: 'removed' });
        } else {
            await db.query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [user_id, postId]);
            await db.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
            res.json({ success: true, action: 'added' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Ruta para OBTENER COMENTARIOS (CORREGIDA)
router.get('/:id/comentarios', async (req, res) => {
    const idPublicacion = req.params.id;
    try {
        // Asegúrate de que tu tabla se llame 'comments' o cámbialo aquí
        const [rows] = await db.query('SELECT * FROM comments WHERE post_id = ?', [idPublicacion]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener comentarios:", error);
        res.status(500).json({ error: "Error al cargar comentarios" });
    }
});

module.exports = router;