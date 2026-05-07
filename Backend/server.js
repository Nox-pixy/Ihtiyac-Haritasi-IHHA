import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Bağlantı Havuzu
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- API YOLLARI ---

// 1. Kayıt
app.post('/api/register', async (req, res) => {
  const { full_name, email, phone, password_hash } = req.body;
  try {
    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, phone, password_hash, identity_doc_status) VALUES ($1, $2, $3, $4, 'Beklemede') RETURNING *",
      [full_name, email, phone, password_hash]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Sunucu hatası");
  }
});

// 2. İhbar (Sinyal)
app.post('/api/needs', async (req, res) => {
  const { citizen_id, category_id, description, latitude, longitude, urgency_level } = req.body;
  try {
    const newNeed = await pool.query(
      "INSERT INTO needs (citizen_id, category_id, description, latitude, longitude, urgency_level, status) VALUES ($1, $2, $3, $4, $5, $6, 'Açık') RETURNING *",
      [citizen_id, category_id, description, latitude, longitude, urgency_level]
    );
    res.json(newNeed.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("İhbar iletilemedi");
  }
});

// 3. Sinyalleri Getir
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await pool.query("SELECT * FROM needs WHERE status = 'Açık'");
    res.json(signals.rows);
  } catch (err) {
    console.error(err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Karargah Backend ${PORT} portunda devriyede!`);
});