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

// --- API YOLLARI ---

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
      return res.status(400).json({ 
        error: "Bu iletişim bilgileri (E-posta veya Telefon) zaten sisteme kayıtlı." 
      });
    }

    const newUser = await pool.query(
      `INSERT INTO ihha_users (
        full_name, email, phone, password_hash, 
        identity_doc_status, akinci_xp, citizen_trust_score, is_banned
      ) VALUES ($1, $2, $3, $4, 'Beklemede', 0, 100, false) 
      RETURNING id, full_name, email, identity_doc_status`,
      [full_name, email, phone, password_hash]
    );

    res.status(201).json({
      message: "Kayıt başarılı. Adli sicil belgeniz admin onayına sunuldu.",
      user: newUser.rows[0]
    });
  } catch (err) { 
    console.error("Kayıt hatası:", err.message);
    res.status(500).json({ error: "Karargah veritabanı kayıt işlemini reddetti." }); 
  }
});

/**
 * 2. KULLANICI GİRİŞİ (Login)
 */
app.post('/api/login', async (req, res) => {
  const { email, password_hash } = req.body;
  try {
    const user = await pool.query("SELECT * FROM ihha_users WHERE email = $1", [email]);
    
    if (user.rows.length === 0 || user.rows[0].password_hash !== password_hash) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı! Erişim reddedildi." });
    }

    if (user.rows[0].is_banned) {
      return res.status(403).json({ error: "Hesabınız güvenlik protokolleri gereği askıya alınmıştır." });
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
    console.error("Giriş hatası:", err.message);
    res.status(500).json({ error: "Giriş işlemi sırasında bir hata oluştu." }); 
  }
});

/**
 * 3. İHBAR OLUŞTURMA
 */
app.post('/api/needs', async (req, res) => {
  const { 
    citizen_id, category_id, description, latitude, longitude, 
    urgency_level, is_for_self, beneficiary_note 
  } = req.body;

  console.log("📥 GELEN SİNYAL VERİSİ:", req.body);

  try {
    const newNeed = await pool.query(
      `INSERT INTO ihha_needs (
        citizen_id, category_id, description, latitude, longitude, 
        urgency_level, is_for_self, beneficiary_note, status, priority_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Beklemede', 0) RETURNING *`,
      [citizen_id, category_id, description, latitude, longitude, urgency_level, is_for_self, beneficiary_note]
    );
    console.log("✅ SİNYAL KAYDEDİLDİ:", newNeed.rows[0]);
    res.status(201).json(newNeed.rows[0]);
  } catch (err) { 
    console.error("❌ SQL KAYIT HATASI:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

/**
 * 4. DİNAMİK SİNYAL LİSTESİ (Evrensel Filtreleme Desteği)
 */
app.get('/api/signals', async (req, res) => {
  const { lat, lng, radius, category, userType, all } = req.query;
  try {
    let queryText = `
      SELECT n.*, c.name as category_name, u.full_name
      FROM ihha_needs n
      LEFT JOIN ihha_categories c ON n.category_id = c.id
      LEFT JOIN ihha_users u ON n.citizen_id = u.id
      WHERE 1=1
    `;
    let params = [];

    // Onay durumu filtresi
    if (all !== 'true') {
      queryText += ` AND n.status = 'Açık'`;
    } else {
      queryText += ` AND (n.status = 'Açık' OR n.status = 'Beklemede')`;
    }

    // Rol Filtresi (Akıncı/Vatandaş Ayrımı)
    if (userType === 'Akıncılar') {
      queryText += ` AND n.urgency_level = 'Kritik'`;
    } else if (userType === 'Vatandaşlar') {
      queryText += ` AND n.urgency_level = 'Normal'`;
    }

    // Kategori Filtresi (Metin bazlı eşleşme)
    if (category && category !== 'Hepsi') {
      params.push(category);
      queryText += ` AND c.name = $${params.length}`;
    }

    // Çap Filtrelemesi (Haversine Formülü)
    if (lat && lng && radius) {
      const latIdx = params.length + 1;
      const lngIdx = params.length + 2;
      const radIdx = params.length + 3;
      params.push(lat, lng, radius);
      queryText += ` AND (6371 * acos(cos(radians($${latIdx})) * cos(radians(n.latitude)) * cos(radians(n.longitude) - radians($${lngIdx})) + sin(radians($${latIdx})) * sin(radians(n.latitude)))) <= $${radIdx}`;
    }

    // Sıralama (Güvenli mod: created_at yoksa id kullanılır)
    queryText += ` ORDER BY n.id DESC`;

    const signals = await pool.query(queryText, params);
    res.json(signals.rows || []);
  } catch (err) { 
    console.error("Sinyal çekme hatası:", err.message);
    res.status(500).json([]); 
  }
});

/**
 * 5. ADMIN & DENETİM PANELİ
 */

app.patch('/api/admin/verify-signal/:id', async (req, res) => {
  const { status } = req.body; 
  try {
    await pool.query("UPDATE ihha_needs SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ message: "Sinyal durumu güncellendi." });
  } catch (err) { 
    res.status(500).json({ error: "Sinyal güncellenemedi." }); 
  }
});

app.patch('/api/admin/verify-user/:id', async (req, res) => {
  const { status } = req.body; 
  try {
    await pool.query("UPDATE ihha_users SET identity_doc_status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ message: "Kullanıcı doğrulama durumu güncellendi." });
  } catch (err) { 
    res.status(500).json({ error: "Kullanıcı durumu güncellenemedi." }); 
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await pool.query("SELECT id, full_name, email, phone, identity_doc_status, akinci_xp, citizen_trust_score, is_banned FROM ihha_users ORDER BY id DESC");
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: "Kullanıcılar yüklenemedi." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🛰️  İHHA KARARGAH BACKEND AKTİF
  -----------------------------------------------
  Protokol    : Kayıt Denetimi & Onay Mekanizması
  Güvenlik    : Mükerrer Kayıt Engeli Aktif
  Port        : ${PORT}
  -----------------------------------------------
  `);
});