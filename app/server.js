const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const client = require('prom-client');
const { pool, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

const recipeCounter = new client.Gauge({
  name: 'recipe_app_total_recipes',
  help: 'Total count of recipes in database'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// UTF-8 Header Enforcement Middleware
app.use((req, res, next) => {
  res.setHeader('Charset', 'utf-8');
  next();
});

// Track metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestCounter.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDurationHistogram.observe({ method: req.method, route, status: res.statusCode }, duration);
  });
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Update dynamic metric
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM recipes');
    if (rows && rows[0]) {
      recipeCounter.set(rows[0].count);
    }
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', database: 'DISCONNECTED', error: err.message });
  }
});

// GET Stats Overview
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ recipeCount }]] = await pool.query('SELECT COUNT(*) as recipeCount FROM recipes');
    const [[{ categoryCount }]] = await pool.query('SELECT COUNT(*) as categoryCount FROM categories');
    const [[{ ingredientCount }]] = await pool.query('SELECT COUNT(*) as ingredientCount FROM ingredients');
    const [[{ reviewCount }]] = await pool.query('SELECT COUNT(*) as reviewCount FROM reviews');
    res.json({
      recipes: recipeCount,
      categories: categoryCount,
      ingredients: ingredientCount,
      reviews: reviewCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Ingredients
app.get('/api/ingredients', async (req, res) => {
  try {
    const [ingredients] = await pool.query('SELECT * FROM ingredients ORDER BY name ASC');
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Recipes with filtering (category, ingredient, search keyword)
app.get('/api/recipes', async (req, res) => {
  try {
    const { category_id, ingredient_id, search } = req.query;
    let sql = `
      SELECT r.*, c.name AS category_name, c.icon AS category_icon,
             COALESCE(AVG(rev.rating), 0) AS avg_rating,
             COUNT(DISTINCT rev.id) AS review_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN reviews rev ON r.id = rev.recipe_id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND r.category_id = ?';
      params.push(category_id);
    }

    if (ingredient_id) {
      sql += ' AND ri.ingredient_id = ?';
      params.push(ingredient_id);
    }

    if (search) {
      sql += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY r.id ORDER BY r.created_at DESC';

    const [recipes] = await pool.query(sql, params);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Recipe Detail by ID
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Recipe details
    const [recipes] = await pool.query(`
      SELECT r.*, c.name AS category_name, c.icon AS category_icon,
             COALESCE(AVG(rev.rating), 0) AS avg_rating,
             COUNT(DISTINCT rev.id) AS review_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN reviews rev ON r.id = rev.recipe_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [id]);

    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipe = recipes[0];

    // Ingredients
    const [ingredients] = await pool.query(`
      SELECT ri.quantity, ri.unit, i.name AS ingredient_name, i.icon
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [id]);

    // Reviews
    const [reviews] = await pool.query(`
      SELECT author, rating, comment, created_at
      FROM reviews
      WHERE recipe_id = ?
      ORDER BY created_at DESC
    `, [id]);

    recipe.ingredients = ingredients;
    recipe.reviews = reviews;

    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST New Recipe
app.get('/api/recipes', async (req, res) => {}); // placeholder for route matching

app.post('/api/recipes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      title,
      category_id,
      description,
      prep_time,
      cook_time,
      servings,
      calories,
      difficulty,
      image_url,
      instructions,
      ingredients // array of { ingredient_id, quantity, unit } or { name, quantity, unit }
    } = req.body;

    if (!title || !category_id) {
      return res.status(400).json({ message: 'Title and category_id are required' });
    }

    const [result] = await connection.query(`
      INSERT INTO recipes (title, category_id, description, prep_time, cook_time, servings, calories, difficulty, image_url, instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      category_id,
      description || '',
      prep_time || 15,
      cook_time || 30,
      servings || 2,
      calories || 350,
      difficulty || 'Trung bình',
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      instructions || ''
    ]);

    const recipeId = result.insertId;

    // Handle ingredients insertion if present
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      for (const ing of ingredients) {
        let ingredientId = ing.ingredient_id;
        if (!ingredientId && ing.name) {
          // Check if exists or insert
          const [existing] = await connection.query('SELECT id FROM ingredients WHERE name = ?', [ing.name]);
          if (existing.length > 0) {
            ingredientId = existing[0].id;
          } else {
            const [newIng] = await connection.query('INSERT INTO ingredients (name) VALUES (?)', [ing.name]);
            ingredientId = newIng.insertId;
          }
        }

        if (ingredientId) {
          await connection.query(`
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
            VALUES (?, ?, ?, ?)
          `, [recipeId, ingredientId, ing.quantity || '1', ing.unit || 'phần']);
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Recipe created successfully', recipeId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// DELETE Recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Review for Recipe
app.post('/api/recipes/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, rating, comment } = req.body;

    if (!author || !rating) {
      return res.status(400).json({ message: 'Author and rating (1-5) are required' });
    }

    await pool.query(`
      INSERT INTO reviews (recipe_id, author, rating, comment)
      VALUES (?, ?, ?, ?)
    `, [id, author, parseInt(rating), comment || '']);

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route to serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(` Recipe Sharing Application running on port ${PORT}`);
  });
}

startServer();
