import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'ihha_gizli_anahtar_2026';
let ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@ihha.com';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
app.use('/uploads', express.static(uploadsDir));

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
  if (err) return console.error('❌ DB Bağlantı Hatası:', err.message);
  console.log('✅ Veritabanına Bağlanıldı!');
  release();
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token gerekli.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }
};

async function ensureSchema() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE)`);
    await pool.query(`INSERT INTO ihha_categories (name) VALUES ('Gıda'),('İlaç & Tıbbi Malzeme'),('Kıyafet & Tekstil'),('Eşya'),('Elektronik'),('Gönüllü') ON CONFLICT (name) DO NOTHING`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_users (
      id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      phone TEXT UNIQUE, password_hash TEXT NOT NULL,
      identity_doc_status TEXT DEFAULT 'Beklemede', identity_doc_path TEXT,
      akinci_xp INT DEFAULT 0, citizen_trust_score INT DEFAULT 100,
      is_banned BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_needs (
      id SERIAL PRIMARY KEY, citizen_id INT REFERENCES ihha_users(id) ON DELETE SET NULL,
      category_id INT REFERENCES ihha_categories(id),
      description TEXT, latitude NUMERIC(10,7) NOT NULL, longitude NUMERIC(10,7) NOT NULL,
      urgency_level TEXT DEFAULT 'Normal', is_for_self BOOLEAN DEFAULT TRUE,
      beneficiary_note TEXT, status TEXT DEFAULT 'Beklemede', priority_score INT DEFAULT 0,
      assigned_to INT REFERENCES ihha_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_disaster_zones (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '',
      latitude NUMERIC(10,7) NOT NULL, longitude NUMERIC(10,7) NOT NULL,
      radius INT DEFAULT 10, severity TEXT DEFAULT 'Yüksek',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_subcategories (
      id SERIAL PRIMARY KEY,
      category_id INT REFERENCES ihha_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      UNIQUE(category_id, name)
    )`);
    // ✅ Görev istek tablosu
    await pool.query(`CREATE TABLE IF NOT EXISTS ihha_task_requests (
      id SERIAL PRIMARY KEY,
      signal_id INT REFERENCES ihha_needs(id) ON DELETE CASCADE,
      requester_id INT REFERENCES ihha_users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'Beklemede',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(signal_id, requester_id)
    )`);
    // ✅ Kullanıcı bilgi güncelleme kolonları
    await pool.query(`ALTER TABLE ihha_users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`).catch(() => {});
    await pool.query(`ALTER TABLE ihha_needs ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES ihha_users(id) ON DELETE SET NULL`).catch(() => {});
    console.log('✅ Şema hazır.');
  } catch (err) { console.error('Şema hatası:', err.message); }
}
ensureSchema();

// ── REGISTER ──────────────────────────────────────────────────────────────────
app.post('/api/register', upload.single('document'), async (req, res) => {
  const { full_name, email, phone, password_hash } = req.body;
  if (!full_name || !email || !password_hash) return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur.' });
  if (phone) {
    const phoneRegex = /^(05)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Telefon numarası 05XX XXX XX XX formatında olmalıdır.' });
    }
  }
  try {
    const check = await pool.query('SELECT id FROM ihha_users WHERE email = $1 OR phone = $2', [email, phone || null]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Bu e-posta veya telefon zaten kayıtlı.' });
    const hashedPassword = await bcrypt.hash(password_hash, 12);
    const docPath = req.file ? req.file.filename : null;
    const newUser = await pool.query(
      `INSERT INTO ihha_users (full_name,email,phone,password_hash,identity_doc_path,identity_doc_status,akinci_xp,citizen_trust_score,is_banned)
       VALUES ($1,$2,$3,$4,$5,'Beklemede',0,100,false) RETURNING id,full_name,email,identity_doc_status`,
      [full_name, email, phone || null, hashedPassword, docPath]
    );
    const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Kayıt başarılı.', user: newUser.rows[0], token });
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    res.status(500).json({ error: 'Kayıt sırasında sunucu hatası.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password_hash } = req.body;
  if (email === ADMIN_EMAIL && password_hash === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 0, email: ADMIN_EMAIL, isAdmin: true }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({
      message: 'Admin girişi başarılı.',
      user: { id: 0, full_name: 'Sistem Yöneticisi', email: ADMIN_EMAIL, status: 'Admin', akinci_xp: 9999, trust_score: 100 },
      token
    });
  }
  try {
    const result = await pool.query('SELECT * FROM ihha_users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    const user = result.rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'Hesabınız askıya alınmıştır.' });
    let passwordMatch = false;
    try { passwordMatch = await bcrypt.compare(password_hash, user.password_hash); } catch { passwordMatch = false; }
    if (!passwordMatch && user.password_hash === password_hash) {
      passwordMatch = true;
      const hashed = await bcrypt.hash(password_hash, 12);
      await pool.query('UPDATE ihha_users SET password_hash = $1 WHERE id = $2', [hashed, user.id]);
    }
    if (!passwordMatch) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Giriş başarılı.',
      user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, status: user.identity_doc_status, akinci_xp: user.akinci_xp, trust_score: user.citizen_trust_score },
      token
    });
  } catch (err) {
    console.error('Giriş hatası:', err.message);
    res.status(500).json({ error: 'Giriş sırasında sunucu hatası.' });
  }
});

// ── KULLANICI BİLGİ GÜNCELLE ─────────────────────────────────────────────────
app.patch('/api/users/:id/update', async (req, res) => {
  const { full_name, phone, current_password, new_password } = req.body;
  const userId = req.params.id;
  try {
    const userRes = await pool.query('SELECT * FROM ihha_users WHERE id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    const user = userRes.rows[0];

    // Şifre değişimi isteniyorsa mevcut şifreyi doğrula
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Mevcut şifre gerekli.' });
      const match = await bcrypt.compare(current_password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
      const hashed = await bcrypt.hash(new_password, 12);
      await pool.query('UPDATE ihha_users SET password_hash=$1 WHERE id=$2', [hashed, userId]);
    }

    // Telefon güncelle
    if (phone && phone !== user.phone) {
      const phoneRegex = /^(05)[0-9]{9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Telefon 05XX formatında olmalı.' });
      }
      const phoneCheck = await pool.query('SELECT id FROM ihha_users WHERE phone=$1 AND id!=$2', [phone, userId]);
      if (phoneCheck.rows.length) return res.status(400).json({ error: 'Bu telefon zaten kayıtlı.' });
      await pool.query('UPDATE ihha_users SET phone=$1 WHERE id=$2', [phone, userId]);
    }

    // Ad güncelle
    if (full_name) {
      await pool.query('UPDATE ihha_users SET full_name=$1 WHERE id=$2', [full_name, userId]);
    }

    const updated = await pool.query('SELECT id,full_name,email,phone,identity_doc_status,akinci_xp,citizen_trust_score FROM ihha_users WHERE id=$1', [userId]);
    const u = updated.rows[0];
    res.json({
      message: 'Bilgiler güncellendi.',
      user: { id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, status: u.identity_doc_status, akinci_xp: u.akinci_xp, trust_score: u.citizen_trust_score }
    });
  } catch (err) {
    console.error('Güncelleme hatası:', err.message);
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// ── NEEDS / SİNYAL OLUŞTUR ───────────────────────────────────────────────────
app.post('/api/needs', async (req, res) => {
  const { citizen_id, category_id, description, latitude, longitude, urgency_level, is_for_self, beneficiary_note } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'Konum bilgisi zorunludur.' });
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (lat < 35.8 || lat > 42.1 || lng < 25.6 || lng > 44.8) {
    return res.status(400).json({ error: 'Sinyal yalnızca Türkiye sınırları içine eklenebilir.' });
  }
  try {
    const newNeed = await pool.query(
      `INSERT INTO ihha_needs (citizen_id,category_id,description,latitude,longitude,urgency_level,is_for_self,beneficiary_note,status,priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Beklemede',0) RETURNING *`,
      [citizen_id||null, category_id||1, description||'', latitude, longitude, urgency_level||'Normal', is_for_self!==undefined?is_for_self:true, beneficiary_note||'']
    );
    io.emit('new_signal', newNeed.rows[0]);
    res.status(201).json(newNeed.rows[0]);
  } catch (err) {
    console.error('Sinyal hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── SİNYAL SİL (kendi sinyali) ───────────────────────────────────────────────
app.delete('/api/signals/:id', async (req, res) => {
  const { user_id } = req.body;
  try {
    const check = await pool.query('SELECT citizen_id FROM ihha_needs WHERE id=$1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Sinyal bulunamadı.' });
    if (parseInt(check.rows[0].citizen_id) !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Yalnızca kendi sinyalinizi silebilirsiniz.' });
    }
    await pool.query('DELETE FROM ihha_needs WHERE id=$1', [req.params.id]);
    io.emit('signal_deleted', { signal_id: req.params.id });
    res.json({ message: 'Sinyal silindi.' });
  } catch (err) {
    console.error('Silme hatası:', err.message);
    res.status(500).json({ error: 'Sinyal silinemedi.' });
  }
});

// ── SİNYAL LİSTESİ ───────────────────────────────────────────────────────────
app.get('/api/signals', async (req, res) => {
  const { lat, lng, radius, category, category_id, userType, all } = req.query;
  try {
    let q = `SELECT n.*, c.name AS category_name, u.full_name FROM ihha_needs n LEFT JOIN ihha_categories c ON n.category_id = c.id LEFT JOIN ihha_users u ON n.citizen_id = u.id WHERE 1=1`;
    let params = [];
    if (all !== 'true') q += ` AND n.status = 'Açık'`;
    else q += ` AND (n.status = 'Açık' OR n.status = 'Beklemede')`;
    if (userType === 'Akıncılar') q += ` AND n.urgency_level = 'Kritik'`;
    else if (userType === 'Vatandaşlar') q += ` AND n.urgency_level = 'Normal'`;
    if (category_id) { params.push(category_id); q += ` AND n.category_id = $${params.length}`; }
    else if (category && category !== 'Hepsi') { params.push(category); q += ` AND c.name = $${params.length}`; }
    if (lat && lng && radius && radius !== '999') {
      const li = params.length+1, lni = params.length+2, ri = params.length+3;
      params.push(lat, lng, radius);
      q += ` AND (6371 * acos(cos(radians($${li})) * cos(radians(n.latitude)) * cos(radians(n.longitude) - radians($${lni})) + sin(radians($${li})) * sin(radians(n.latitude)))) <= $${ri}`;
    }
    q += ` ORDER BY CASE WHEN n.status = 'Beklemede' THEN 0 WHEN n.status = 'Açık' THEN 1 ELSE 2 END, n.id DESC`;
    const signals = await pool.query(q, params);
    res.json(signals.rows || []);
  } catch (err) {
    console.error('Sinyal listesi hatası:', err.message);
    res.status(500).json([]);
  }
});

// ── GÖREV İSTEĞİ GÖNDER ──────────────────────────────────────────────────────
app.post('/api/signals/request', async (req, res) => {
  const { signal_id, user_id } = req.body;
  if (!signal_id || !user_id) return res.status(400).json({ error: 'signal_id ve user_id zorunludur.' });
  try {
    const sigRes = await pool.query('SELECT citizen_id, assigned_to FROM ihha_needs WHERE id=$1', [signal_id]);
    if (!sigRes.rows.length) return res.status(404).json({ error: 'Sinyal bulunamadı.' });
    if (sigRes.rows[0].assigned_to) return res.status(409).json({ error: 'Bu görev zaten üstlenildi.' });
    if (parseInt(sigRes.rows[0].citizen_id) === parseInt(user_id)) {
      return res.status(400).json({ error: 'Kendi sinyalinize istek gönderemezsiniz.' });
    }

    const existing = await pool.query(
      "SELECT id FROM ihha_task_requests WHERE signal_id=$1 AND requester_id=$2 AND status='Beklemede'",
      [signal_id, user_id]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'Zaten bir isteğiniz var.' });

    const userRes = await pool.query('SELECT full_name FROM ihha_users WHERE id=$1', [user_id]);
    const requesterName = userRes.rows[0]?.full_name || 'Bir kullanıcı';

    const result = await pool.query(
      'INSERT INTO ihha_task_requests (signal_id, requester_id) VALUES ($1,$2) RETURNING *',
      [signal_id, user_id]
    );

    // Sinyal sahibine Socket.io bildirimi
    const ownerId = sigRes.rows[0].citizen_id;
    if (ownerId) {
      io.emit(`task_request_${ownerId}`, {
        request_id: result.rows[0].id,
        signal_id,
        requester_name: requesterName,
        requester_id: user_id
      });
    }

    res.status(201).json({ message: `İstek gönderildi! ${requesterName} sinyal sahibinin onayını bekliyor.` });
  } catch (err) {
    console.error('Görev isteği hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GÖREV İSTEĞİ KABUL ET ────────────────────────────────────────────────────
app.post('/api/signals/accept-request', async (req, res) => {
  const { request_id, owner_id } = req.body;
  try {
    const reqRow = await pool.query('SELECT * FROM ihha_task_requests WHERE id=$1', [request_id]);
    if (!reqRow.rows.length) return res.status(404).json({ error: 'İstek bulunamadı.' });
    const { signal_id, requester_id } = reqRow.rows[0];

    const sig = await pool.query('SELECT citizen_id FROM ihha_needs WHERE id=$1', [signal_id]);
    if (parseInt(sig.rows[0]?.citizen_id) !== parseInt(owner_id)) {
      return res.status(403).json({ error: 'Yalnızca sinyal sahibi kabul edebilir.' });
    }

    await pool.query('UPDATE ihha_needs SET assigned_to=$1 WHERE id=$2', [requester_id, signal_id]);
    await pool.query('UPDATE ihha_users SET akinci_xp=akinci_xp+10 WHERE id=$1', [requester_id]);
    await pool.query("UPDATE ihha_task_requests SET status='Kabul' WHERE id=$1", [request_id]);
    // Diğer bekleyen istekleri reddet
    await pool.query("UPDATE ihha_task_requests SET status='Reddedildi' WHERE signal_id=$1 AND id!=$2 AND status='Beklemede'", [signal_id, request_id]);

    io.emit(`task_accepted_${requester_id}`, { signal_id, message: 'Görev isteğin kabul edildi! Artık mesajlaşabilirsiniz.' });
    io.emit('signal_updated', { signal_id, status: 'Açık' });

    res.json({ message: 'Görev kabul edildi! +10 XP kazandırıldı.' });
  } catch (err) {
    console.error('Kabul hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GÖREV İSTEĞİ REDDET ──────────────────────────────────────────────────────
app.post('/api/signals/reject-request', async (req, res) => {
  const { request_id, owner_id } = req.body;
  try {
    const reqRow = await pool.query('SELECT * FROM ihha_task_requests WHERE id=$1', [request_id]);
    if (!reqRow.rows.length) return res.status(404).json({ error: 'İstek bulunamadı.' });

    const sig = await pool.query('SELECT citizen_id FROM ihha_needs WHERE id=$1', [reqRow.rows[0].signal_id]);
    if (parseInt(sig.rows[0]?.citizen_id) !== parseInt(owner_id)) {
      return res.status(403).json({ error: 'Yalnızca sinyal sahibi reddedebilir.' });
    }

    await pool.query("UPDATE ihha_task_requests SET status='Reddedildi' WHERE id=$1", [request_id]);
    io.emit(`task_rejected_${reqRow.rows[0].requester_id}`, { signal_id: reqRow.rows[0].signal_id });
    res.json({ message: 'İstek reddedildi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SİNYALİN BEKLEYEN İSTEKLERİ ─────────────────────────────────────────────
app.get('/api/signals/:id/requests', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.full_name, u.akinci_xp, u.identity_doc_status
      FROM ihha_task_requests r
      JOIN ihha_users u ON r.requester_id = u.id
      WHERE r.signal_id=$1 AND r.status='Beklemede'
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GÖREV ÜSTLEN (direkt — eski endpoint korunuyor) ──────────────────────────
app.post('/api/signals/assign', async (req, res) => {
  const { signal_id, user_id } = req.body;
  if (!signal_id || !user_id) return res.status(400).json({ error: 'signal_id ve user_id zorunludur.' });
  try {
    const check = await pool.query('SELECT assigned_to FROM ihha_needs WHERE id = $1', [signal_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sinyal bulunamadı.' });
    if (check.rows[0].assigned_to) return res.status(409).json({ error: 'Bu görev zaten üstlenildi.' });
    await pool.query('UPDATE ihha_needs SET assigned_to = $1 WHERE id = $2', [user_id, signal_id]);
    await pool.query('UPDATE ihha_users SET akinci_xp = akinci_xp + 10 WHERE id = $1', [user_id]);
    res.json({ message: 'Görev üstlenildi! +10 XP kazandın!' });
  } catch (err) {
    console.error('Görev atama hatası:', err.message);
    res.status(500).json({ error: 'Görev atama hatası.' });
  }
});

// ── GÖREV TAMAMLA ─────────────────────────────────────────────────────────────
app.post('/api/signals/complete', async (req, res) => {
  const { signal_id, user_id } = req.body;
  if (!signal_id || !user_id) return res.status(400).json({ error: 'signal_id ve user_id zorunludur.' });
  try {
    const check = await pool.query('SELECT assigned_to FROM ihha_needs WHERE id = $1', [signal_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sinyal bulunamadı.' });
    if (parseInt(check.rows[0].assigned_to) !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Bu görevi yalnızca üstlenen kişi tamamlayabilir.' });
    }
    await pool.query("UPDATE ihha_needs SET status = 'Tamamlandı' WHERE id = $1", [signal_id]);
    await pool.query('UPDATE ihha_users SET akinci_xp = akinci_xp + 50 WHERE id = $1', [user_id]);
    io.emit('signal_updated', { signal_id, status: 'Tamamlandı' });
    res.json({ message: 'Görev tamamlandı! +50 XP kazandın!' });
  } catch (err) {
    console.error('Görev tamamlama hatası:', err.message);
    res.status(500).json({ error: 'Görev tamamlanamadı.' });
  }
});

// ── ADMİN: SINYAL LİSTESİ ─────────────────────────────────────────────────────
app.get('/api/admin/signals', async (req, res) => {
  try {
    const result = await pool.query(`SELECT n.*, c.name AS category_name, u.full_name FROM ihha_needs n LEFT JOIN ihha_categories c ON n.category_id = c.id LEFT JOIN ihha_users u ON n.citizen_id = u.id ORDER BY CASE WHEN n.status = 'Beklemede' THEN 0 ELSE 1 END, n.id DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin sinyal hatası:', err.message);
    res.status(500).json({ error: 'Sinyaller yüklenemedi.' });
  }
});

// ── ADMİN: SİNYAL GÜNCELLE ───────────────────────────────────────────────────
app.patch('/api/admin/verify-signal/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(`UPDATE ihha_needs SET status = $1 WHERE id = $2 RETURNING *`, [status, req.params.id]);
    if (result.rows.length > 0) io.emit('signal_updated', { signal_id: req.params.id, status });
    res.json({ message: 'Sinyal güncellendi.' });
  } catch (err) {
    console.error('Sinyal güncelleme hatası:', err.message);
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// ── ADMİN: KULLANICI LİSTESİ ─────────────────────────────────────────────────
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await pool.query(`SELECT id,full_name,email,phone,identity_doc_status,identity_doc_path,akinci_xp,citizen_trust_score,is_banned,created_at FROM ihha_users ORDER BY id DESC`);
    res.json(users.rows);
  } catch (err) {
    console.error('Kullanıcı listesi hatası:', err.message);
    res.status(500).json({ error: 'Kullanıcılar yüklenemedi.' });
  }
});

// ── ADMİN: KULLANICI DOĞRULA ─────────────────────────────────────────────────
app.patch('/api/admin/verify-user/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE ihha_users SET identity_doc_status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Kullanıcı güncellendi.' });
  } catch (err) {
    console.error('Kullanıcı doğrulama hatası:', err.message);
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// ── ADMİN: KULLANICI BANLA ───────────────────────────────────────────────────
app.patch('/api/admin/ban-user/:id', async (req, res) => {
  const { is_banned } = req.body;
  try {
    await pool.query('UPDATE ihha_users SET is_banned = $1 WHERE id = $2', [is_banned, req.params.id]);
    res.json({ message: `Kullanıcı ${is_banned ? 'yasaklandı' : 'yasak kaldırıldı'}.` });
  } catch (err) {
    console.error('Ban hatası:', err.message);
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// ── ADMİN: İSTATİSTİKLER ─────────────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [signals, users, pending, assigned] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM ihha_needs WHERE status = 'Açık'"),
      pool.query("SELECT COUNT(*) FROM ihha_users"),
      pool.query("SELECT COUNT(*) FROM ihha_needs WHERE status = 'Beklemede'"),
      pool.query("SELECT COUNT(*) FROM ihha_needs WHERE assigned_to IS NOT NULL")
    ]);
    res.json({
      active_signals:  parseInt(signals.rows[0].count),
      total_users:     parseInt(users.rows[0].count),
      pending_signals: parseInt(pending.rows[0].count),
      assigned_tasks:  parseInt(assigned.rows[0].count)
    });
  } catch (err) {
    console.error('İstatistik hatası:', err.message);
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// ── LİDERBOARD ───────────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, akinci_xp, identity_doc_status,
        (SELECT COUNT(*) FROM ihha_needs WHERE assigned_to = ihha_users.id) as completed_tasks
      FROM ihha_users WHERE is_banned = false
      ORDER BY akinci_xp DESC LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Liderboard hatası:', err.message);
    res.status(500).json({ error: 'Liderboard alınamadı.' });
  }
});

// ── KULLANICININ KENDİ SİNYALLERİ ────────────────────────────────────────────
app.get('/api/my-signals/:user_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, c.name AS category_name FROM ihha_needs n
      LEFT JOIN ihha_categories c ON n.category_id = c.id
      WHERE n.citizen_id = $1 ORDER BY n.created_at DESC
    `, [req.params.user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Sinyal geçmişi hatası:', err.message);
    res.status(500).json({ error: 'Sinyaller alınamadı.' });
  }
});

// ── KATEGORİ YÖNETİMİ ────────────────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ihha_categories ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Kategoriler alınamadı.' }); }
});

app.post('/api/admin/categories', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Kategori adı zorunludur.' });
  try {
    const result = await pool.query('INSERT INTO ihha_categories (name) VALUES ($1) RETURNING *', [name.trim()]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Bu kategori zaten mevcut.' });
    res.status(500).json({ error: 'Kategori eklenemedi.' });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ihha_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kategori silindi.' });
  } catch (err) { res.status(500).json({ error: 'Kategori silinemedi.' }); }
});

// ── ALT KATEGORİLER ───────────────────────────────────────────────────────────
app.get('/api/categories/:id/subcategories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ihha_subcategories WHERE category_id = $1 ORDER BY id', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Alt kategoriler alınamadı.' }); }
});

app.post('/api/admin/subcategories', async (req, res) => {
  const { category_id, name } = req.body;
  if (!category_id || !name?.trim()) return res.status(400).json({ error: 'Kategori ve isim zorunludur.' });
  try {
    const result = await pool.query(
      'INSERT INTO ihha_subcategories (category_id, name) VALUES ($1,$2) RETURNING *',
      [category_id, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Bu alt kategori zaten mevcut.' });
    res.status(500).json({ error: 'Alt kategori eklenemedi.' });
  }
});

app.delete('/api/admin/subcategories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ihha_subcategories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Alt kategori silindi.' });
  } catch (err) { res.status(500).json({ error: 'Silinemedi.' }); }
});

// ── AFET BÖLGELERİ ────────────────────────────────────────────────────────────
app.get('/api/disaster-zones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ihha_disaster_zones ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Afet bölgeleri alınamadı.' }); }
});

app.post('/api/admin/disaster-zones', async (req, res) => {
  const { title, description, latitude, longitude, radius, severity } = req.body;
  if (!title || !latitude || !longitude) return res.status(400).json({ error: 'Başlık ve konum zorunludur.' });
  try {
    const result = await pool.query(
      `INSERT INTO ihha_disaster_zones (title, description, latitude, longitude, radius, severity)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description || '', latitude, longitude, radius || 10, severity || 'Yüksek']
    );
    io.emit('disaster_zone_added', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Afet bölgesi eklenemedi.' }); }
});

app.delete('/api/admin/disaster-zones/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ihha_disaster_zones WHERE id = $1', [req.params.id]);
    io.emit('disaster_zone_removed', { id: req.params.id });
    res.json({ message: 'Afet bölgesi kaldırıldı.' });
  } catch (err) { res.status(500).json({ error: 'Silinemedi.' }); }
});

// ── İHBAR BİLDİRİMLERİ ───────────────────────────────────────────────────────
app.get('/api/admin/ihbarlar', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, c.name AS category_name, u.full_name
      FROM ihha_needs n
      LEFT JOIN ihha_categories c ON n.category_id = c.id
      LEFT JOIN ihha_users u ON n.citizen_id = u.id
      WHERE n.urgency_level = 'Kritik' AND n.status = 'Beklemede'
      ORDER BY n.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'İhbarlar alınamadı.' }); }
});

// ── ADMİN: KİMLİK BİLGİLERİ DEĞİŞTİR ────────────────────────────────────────
app.patch('/api/admin/change-credentials', async (req, res) => {
  const { new_email, new_password, current_password } = req.body;
  if (current_password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
  }
  if (!new_email && !new_password) {
    return res.status(400).json({ error: 'Yeni e-posta veya şifre giriniz.' });
  }
  if (new_email) ADMIN_EMAIL = new_email;
  if (new_password) ADMIN_PASSWORD = new_password;
  console.log(`✅ Admin kimliği güncellendi: ${ADMIN_EMAIL}`);
  res.json({ message: 'Admin bilgileri güncellendi. Lütfen yeni bilgilerle giriş yapın.' });
});

// ── WEBSOCKET ─────────────────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const chatRooms = {};

io.on('connection', (socket) => {
  console.log('🔌 Bağlantı:', socket.id);

  // ✅ Kullanıcı kendi bildirim odasına katılır
  socket.on('register_user', ({ user_id }) => {
    socket.join(`user_${user_id}`);
    socket.data.user_id = user_id;
  });

  socket.on('join_room', ({ signal_id, user }) => {
    const room = `signal_${signal_id}`;
    socket.join(room);
    socket.data.user = user;
    socket.data.room = room;
    if (chatRooms[room]) socket.emit('message_history', chatRooms[room]);
    socket.to(room).emit('user_joined', {
      text: `${user?.full_name || 'Bir kullanıcı'} bağlandı.`,
      from: 'system',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('send_message', ({ signal_id, message }) => {
    const room = `signal_${signal_id}`;
    const msgData = {
      id: Date.now(), from: 'user',
      name: socket.data.user?.full_name || 'Anonim',
      text: message,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    if (!chatRooms[room]) chatRooms[room] = [];
    chatRooms[room].push(msgData);
    if (chatRooms[room].length > 50) chatRooms[room].shift();
    io.to(room).emit('receive_message', msgData);
  });

  socket.on('disconnect', () => {
    if (socket.data.room) {
      socket.to(socket.data.room).emit('user_left', {
        text: `${socket.data.user?.full_name || 'Bir kullanıcı'} ayrıldı.`,
        from: 'system',
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      });
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🛰️  İHHA Backend aktif — Port: ${PORT}\n   Admin: ${ADMIN_EMAIL}`));