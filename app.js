const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // Cargar las variables de entorno

const app = express();

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto puede ser necesario dependiendo del entorno de tu base de datos
  }
});

console.log('Database URL:', process.env.DATABASE_URL);


// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para configurar CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Ruta para obtener todas las publicaciones
app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts');
    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching posts from database', error);
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// Ruta para obtener una publicación específica por ID
app.get('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (result.rows.length > 0) {
      res.json({ post: result.rows[0] });
    } else {
      res.status(404).json({ message: 'Post not found.' });
    }
  } catch (error) {
    console.error('Error fetching post from database', error);
    res.status(500).json({ message: 'Failed to fetch post.' });
  }
});

// Ruta para crear una nueva publicación
app.post('/posts', async (req, res) => {
  const { body, author } = req.body;
  const newPostId = uuidv4(); // Usar uuid para generar un ID único

  try {
    const result = await pool.query(
      'INSERT INTO posts (id, body, author) VALUES ($1, $2, $3) RETURNING *',
      [newPostId, body, author]
    );
    res.status(201).json({ message: 'Stored new post.', post: result.rows[0] });
  } catch (error) {
    console.error('Error storing post in database', error);
    res.status(500).json({ message: 'Failed to store post.' });
  }
});

// Configuración del puerto y arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
