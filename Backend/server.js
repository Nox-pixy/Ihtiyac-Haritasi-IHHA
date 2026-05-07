import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Bağlantı Havuzu - Mükemmeliyetçi Ayarlar
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Veritabanı Bağlantı Testi
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Karargah Veritabanı Bağlantı Hatası:', err.stack);
  }
  console.log('✅ Karargah Veritabanına Başarıyla Sızıldı!');
  release();
});

// --- API YOLLARI (ihha_ ÖN EKİ İLE GÜNCELLENDİ) ---

/**
 * 1. KULLANICI KAYIT (Register)
 */
app.post('/api/register', async (req, res) => {
  const { full_name, email, phone, password_hash } = req.body;
  
  try {
    const checkUser = await pool.query(
      "SELECT id FROM ihha_users WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "Bu birim (email/tel) zaten sisteme kayıtlı." });
    }

    const newUser = await pool.query(
      `INSERT INTO ihha_users (
        full_name, email, phone, password_hash, 
        identity_doc_status, akinci_xp, citizen_trust_score, is_banned
      ) VALUES ($1, $2, $3, $4, 'Beklemede', 0, 100, false) 
      RETURNING id, full_name, email, identity_doc_status`,
      [full_name, email, phone, password_hash]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Kayıt Hatası:', err.message);
    res.status(500).json({ error: "Karargah veritabanı kayıt işlemi reddetti." });
  }
});

/**
 * 2. KULLANICI GİRİŞİ (Login)
 */
app.post('/api/login', async (req, res) => {
  const { email, password_hash } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM ihha_users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Birim bulunamadı. Önce kayıt olmalısın." });
    }

    if (user.rows[0].password_hash !== password_hash) {
      return res.status(401).json({ error: "Hatalı şifre! Erişim reddedildi." });
    }

    if (user.rows[0].is_banned) {
      return res.status(403).json({ error: "Erişimin Karargah tarafından askıya alınmış." });
    }

    res.json({
      message: "Giriş başarılı. Karargaha hoş geldin.",
      user: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email,
        status: user.rows[0].identity_doc_status,
        akinci_xp: user.rows[0].akinci_xp,
        trust_score: user.rows[0].citizen_trust_score
      }
    });

  } catch (err) {
    console.error('Giriş Hatası:', err.message);
    res.status(500).json({ error: "Sunucu bağlantı hatası." });
  }
});

/**
 * 3. İHBAR OLUŞTURMA (Sinyal Paneli İçin)
 */
app.post('/api/needs', async (req, res) => {
  const { 
    citizen_id, category_id, description, 
    latitude, longitude, urgency_level, is_for_self, beneficiary_note 
  } = req.body;

  try {
    const newNeed = await pool.query(
      `INSERT INTO ihha_needs (
        citizen_id, category_id, description, 
        latitude, longitude, urgency_level, 
        is_for_self, beneficiary_note, status, priority_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Açık', 0) 
      RETURNING *`,
      [citizen_id, category_id, description, latitude, longitude, urgency_level, is_for_self, beneficiary_note]
    );
    res.status(201).json(newNeed.rows[0]);
  } catch (err) {
    console.error('Sinyal Hatası:', err.message);
    res.status(500).json({ error: "Sinyal iletilemedi." });
  }
});

/**
 * 4. CANLI SİNYAL TAKİBİ
 */
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await pool.query(
      `SELECT n.*, c.name as category_name 
       FROM ihha_needs n 
       LEFT JOIN ihha_categories c ON n.category_id = c.id 
       WHERE n.status = 'Açık' 
       ORDER BY n.last_verified_at DESC`
    );
    res.json(signals.rows);
  } catch (err) {
    console.error('Sinyal Listeleme Hatası:', err.message);
    res.status(500).json({ error: "Sinyaller yüklenemedi." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🛰️  İHHA KARARGAH BACKEND AKTİF (ÖN EK MODU: ihha_)
  -----------------------------------------------
  Sistem Portu : ${PORT}
  Veri Tabanı  : PostgreSQL (Çakışma Önleyici Aktif)
  -----------------------------------------------
  `);
});