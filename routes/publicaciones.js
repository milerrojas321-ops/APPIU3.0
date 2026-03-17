const express = require('express');
const router = express.Router();
const db = require('../data/db'); // Tu conexión a la base de datos
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: 'public/uploads/', // Asegúrate de que esta carpeta exista
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Aplica el middleware 'upload.single' en la ruta
router.post('/crear', upload.single('image'), async (req, res) => {
    try {
        const { user_id, username, content, plant_name } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        // Si alguna de estas variables es undefined, MySQL dará error 500
        const query = 'INSERT INTO posts (user_id, username, content, plant_name, image_url) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [user_id, username, content, plant_name, image_url]);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error); // ESTO TE DIRÁ EL ERROR REAL EN LA CONSOLA DE VS CODE
        res.status(500).send(error.message);
    }
});


// 2. Ruta para CREAR publicación (Recibe el FormData)
// El nombre 'image' debe ser igual al que pusiste en formData.append('image', ...)
router.post('/crear', upload.single('image'), async (req, res) => {
    try {
        const { user_id, username, content, plant_name } = req.body;
        
        // Si el usuario subió foto, usamos la ruta del archivo, si no, null
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const query = 'INSERT INTO posts (user_id, username, content, plant_name, image_url) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [user_id, username, content, plant_name, image_url]);

        res.status(201).json({ success: true, message: "Publicación creada con éxito" });
    } catch (error) {
        console.error("Error en servidor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Ruta para OBTENER las publicaciones
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/:id/like', async (req, res) => {
    const postId = req.params.id;
    const { user_id } = req.body;

    try {
        // 1. Verificar si el usuario ya le dio like a este post
        const [existe] = await db.query(
            'SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?', 
            [user_id, postId]
        );

        if (existe.length > 0) {
            // CASO A: EL LIKE YA EXISTE -> VAMOS A QUITARLO (Toggle Off)
            
            // Borramos de la tabla de relaciones
            await db.query(
                'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', 
                [user_id, postId]
            );

            // Restamos 1 al contador global del post
            await db.query(
                'UPDATE posts SET likes = likes - 1 WHERE id = ?', 
                [postId]
            );

            res.json({ success: true, action: 'removed', message: "Like retirado" });

        } else {
            // CASO B: EL LIKE NO EXISTE -> VAMOS A PONERLO (Toggle On)
            
            // Insertamos la relación
            await db.query(
                'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', 
                [user_id, postId]
            );

            // Sumamos 1 al contador global del post
            await db.query(
                'UPDATE posts SET likes = likes + 1 WHERE id = ?', 
                [postId]
            );

            res.json({ success: true, action: 'added', message: "Like añadido" });
        }

    } catch (error) {
        console.error("Error en el sistema de likes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;