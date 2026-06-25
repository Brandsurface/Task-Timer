// server.js — TaskTimer API (v3)
'use strict';

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const multer   = require('multer');
const db       = require('./db');

const app = express();
const PORT       = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tasktimer-change-in-production-please';

// ── UPLOADS DIR ──
const DATA_DIR    = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  // 25MB safety net. The frontend compresses images before upload, so the
  // body is normally a few hundred KB — this generous cap covers the case
  // where, on some device, client-side compression doesn't run and the
  // original phone photo (often several MB) is sent instead.
  limits:  { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'));
  },
});

// ── SMTP / EMAIL CONFIG ──
// Set these environment variables to enable email delivery.
// Without them, the reset code is returned in the API response (admin flow).
const SMTP_CONFIG = {
  host:    process.env.SMTP_HOST || null,
  port:    parseInt(process.env.SMTP_PORT || '587'),
  secure:  process.env.SMTP_SECURE === 'true',
  user:    process.env.SMTP_USER || null,
  pass:    process.env.SMTP_PASS || null,
  from:    process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tasktimer.app',
  appUrl:  process.env.APP_URL  || 'http://localhost:3001',
};
const SMTP_ENABLED = !!(SMTP_CONFIG.host && SMTP_CONFIG.user && SMTP_CONFIG.pass);

// Lazy-load nodemailer only if SMTP is configured
let transporter = null;
function getMailer() {
  if (!SMTP_ENABLED) return null;
  if (!transporter) {
    try {
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        secure: SMTP_CONFIG.secure,
        auth: { user: SMTP_CONFIG.user, pass: SMTP_CONFIG.pass },
      });
    } catch {
      console.warn('[TaskTimer] nodemailer not installed — run: npm install nodemailer');
      return null;
    }
  }
  return transporter;
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// ── ICONS & MANIFEST ──
const ICONS_DIR = path.join(__dirname, 'public', 'icons');

// Cache existence at startup — avoids fs.existsSync on every request
const _iconCache = {};
const serveIcon = (file) => {
  const p = path.join(ICONS_DIR, file);
  _iconCache[file] = fs.existsSync(p);
  return (req, res) => {
    if (_iconCache[file]) return res.sendFile(p);
    res.status(204).end();
  };
};

app.get('/favicon.png',          serveIcon('favicon.png'));
app.get('/icon-192.png',         serveIcon('icon-192.png'));
app.get('/icon-512.png',         serveIcon('icon-512.png'));
app.get('/apple-touch-icon.png', serveIcon('apple-touch-icon.png'));

// Web App Manifest — enables "Add to Home Screen" on mobile
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'TaskTimer',
    short_name: 'TaskTimer',
    description: 'Track your work time',
    start_url: '/',
    display: 'standalone',
    background_color: '#070809',
    theme_color: '#f07c28',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  });
});

// Service worker must not be cached by browser — must be before express.static
app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'frontend/dist/sw.js'));
});

app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── AUTH MIDDLEWARE ──
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session — please log in again' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ── API KEY AUTH ──
// Separate middleware for Chrome extension and external integrations
// Accepts: Authorization: ApiKey <key>
function apiKeyAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('ApiKey ')) return res.status(401).json({ error: 'API key required' });
  const key = header.slice(7).trim();
  if (!key) return res.status(401).json({ error: 'API key required' });

  // Find user by api_key (stored as plain SHA-256 hex for fast lookup)
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(
    crypto.createHash('sha256').update(key).digest('hex')
  );
  if (!user) return res.status(401).json({ error: 'Invalid API key' });
  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

// Accept both JWT and API key for external endpoints
function authOrApiKey(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('ApiKey ')) return apiKeyAuth(req, res, next);
  return auth(req, res, next);
}

// ── HELPERS ──
function todayDK() {
  // Always use Copenhagen timezone — Docker containers run UTC by default
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Copenhagen' });
}

function timeToSeconds(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let seconds = (eh * 60 + em - sh * 60 - sm) * 60;
  if (seconds < 0) seconds += 86400;
  return seconds;
}

function validHour(h) {
  const n = parseInt(h);
  return Number.isInteger(n) && n >= 0 && n <= 23;
}

// ─────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email?.trim() || !name?.trim() || !password)
    return res.status(400).json({ error: 'Please fill in all fields' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const count = db.prepare('SELECT COUNT(*) as n FROM users').get();
  const role  = count.n === 0 ? 'admin' : 'user';
  const hash  = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      'INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)'
    ).run(email.toLowerCase().trim(), name.trim(), hash, role);

    const user  = db.prepare('SELECT id, email, name, role, day_end_hour, day_end_minute, preferences FROM users WHERE id = ?').get(result.lastInsertRowid);
    try { user.preferences = user.preferences ? JSON.parse(user.preferences) : null; } catch { user.preferences = null; }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Please enter email and password' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Incorrect email or password' });

  const { password: _, reset_token: _rt, reset_token_expires: _rte, ...safeUser } = user;
  // rememberMe = 30 days, otherwise 12 hours (session-like)
  const expiresIn = rememberMe ? '30d' : '12h';
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn });
  res.json({ token, user: safeUser });
});

// ── PASSWORD RESET (self-hosted: admin generates token, shares it out-of-band) ──

// Step 1 — request reset token (any user can request for their own email)
// Admin can call this for any email to get the token back
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  // Always respond success to prevent email enumeration — but only do work if user exists
  if (!user) return res.json({ message: 'If that address is registered, a reset code has been sent.' });

  // Generate an 8-char uppercase hex token
  const token   = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(token, expires, user.id);

  const mailer = getMailer();
  if (mailer) {
    // ── EMAIL MODE: send reset code to user ──
    const resetUrl = `${SMTP_CONFIG.appUrl}/?reset=${token}&email=${encodeURIComponent(user.email)}`;
    try {
      await mailer.sendMail({
        from:    `"TaskTimer" <${SMTP_CONFIG.from}>`,
        to:      user.email,
        subject: 'Your TaskTimer password reset code',
        text: `Hi ${user.name},\n\nYour reset code is: ${token}\n\nThis code expires in 2 hours.\n\nOr use this link: ${resetUrl}\n\nIf you didn't request this, ignore this email.`,
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:0 auto;color:#111">
            <h2 style="margin-bottom:4px">Reset your password</h2>
            <p>Hi ${user.name},</p>
            <p>Enter this code in the app to reset your password:</p>
            <div style="background:#f4f4f4;border-radius:8px;padding:16px 24px;text-align:center;margin:20px 0">
              <span style="font-family:monospace;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#f07c28">${token}</span>
            </div>
            <p style="color:#666;font-size:13px">This code expires in 2 hours. If you didn't request this, ignore this email.</p>
          </div>`,
      });
      console.log(`[TaskTimer] Password reset email sent to ${user.email}`);
    } catch (err) {
      console.error('[TaskTimer] Failed to send reset email:', err.message);
      // Fall through — still return admin code so it's not silently lost
    }
    return res.json({ message: `Reset code sent to ${user.email}. Check your inbox.` });
  } else {
    // ── ADMIN MODE: no SMTP configured — return code directly ──
    console.log(`[TaskTimer] Password reset code for ${user.email}: ${token} (expires ${expires})`);
    return res.json({
      message:   'No email server configured. Share this code with the user.',
      resetCode: token,
      expiresAt: expires,
    });
  }
});

// Step 2 — use token to set new password
app.post('/api/auth/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword)
    return res.status(400).json({ error: 'Email, reset code, and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.reset_token)
    return res.status(400).json({ error: 'Invalid or expired reset code' });

  if (user.reset_token !== token.toUpperCase().trim())
    return res.status(400).json({ error: 'Invalid reset code' });

  if (new Date(user.reset_token_expires) < new Date())
    return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(hashed, user.id);

  res.json({ message: 'Password updated. You can now sign in.' });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, day_end_hour, day_end_minute, preferences FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try { user.preferences = user.preferences ? JSON.parse(user.preferences) : null; } catch { user.preferences = null; }
  res.json(user);
});

app.patch('/api/auth/me', auth, (req, res) => {
  const { name, day_end_hour, day_end_minute, current_password, new_password, preferences } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updates = {};
  if (name !== undefined && name.trim()) updates.name = name.trim();

  if (day_end_hour !== undefined) {
    if (!validHour(day_end_hour)) return res.status(400).json({ error: 'Invalid hour (0-23)' });
    updates.day_end_hour = parseInt(day_end_hour);
  }
  if (day_end_minute !== undefined) {
    const m = parseInt(day_end_minute);
    if (isNaN(m) || m < 0 || m > 59) return res.status(400).json({ error: 'Invalid minute (0-59)' });
    updates.day_end_minute = m;
  }

  if (new_password !== undefined) {
    if (!current_password) return res.status(400).json({ error: 'Current password required' });
    if (!bcrypt.compareSync(current_password, user.password))
      return res.status(401).json({ error: 'Incorrect current password' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    updates.password = bcrypt.hashSync(new_password, 10);
  }

  if (preferences !== undefined) {
    if (typeof preferences !== 'object' || preferences === null)
      return res.status(400).json({ error: 'Invalid preferences' });
    updates.preferences = JSON.stringify(preferences);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.user.id);

  const updated = db.prepare('SELECT id, email, name, role, day_end_hour, day_end_minute, preferences FROM users WHERE id = ?').get(req.user.id);
  try { updated.preferences = updated.preferences ? JSON.parse(updated.preferences) : null; } catch { updated.preferences = null; }
  res.json(updated);
});

// ─────────────────────────────────────────
//  TASKS
// ─────────────────────────────────────────

app.get('/api/tasks', auth, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*,
      COALESCE(SUM(CASE WHEN e.committed = 1 THEN e.seconds ELSE 0 END), 0) AS total_committed_seconds
    FROM tasks t
    LEFT JOIN time_entries e ON e.task_id = t.id AND e.user_id = t.user_id
    WHERE t.user_id = ? AND t.archived = 0
    GROUP BY t.id
    ORDER BY t.sort_order ASC, t.created_at ASC
  `).all(req.user.id);
  res.json(tasks);
});

app.post('/api/tasks', auth, (req, res) => {
  const { name, color, budget_seconds } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Task name required' });

  // New tasks go to the top: take the lowest sort_order and subtract 1.
  // O(1) — preserves every existing task's order without mass updates.
  const minOrder = db.prepare('SELECT MIN(sort_order) as m FROM tasks WHERE user_id = ?').get(req.user.id);
  const result   = db.prepare(
    'INSERT INTO tasks (user_id, name, color, sort_order, budget_seconds) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, name.trim(), color || '#f07c28', (minOrder.m ?? 0) - 1, budget_seconds || 0);

  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
});

app.patch('/api/tasks/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { name, color, sort_order, budget_seconds, pinned } = req.body;
  const updates = {};
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) return res.status(400).json({ error: 'Task name cannot be empty' });
    updates.name = trimmed;
  }
  if (color          !== undefined) updates.color          = color;
  if (sort_order     !== undefined) updates.sort_order     = sort_order;
  if (budget_seconds !== undefined) updates.budget_seconds = Math.max(0, parseInt(budget_seconds) || 0);
  if (pinned         !== undefined) updates.pinned         = pinned ? 1 : 0;

  // If nothing changed, return current task as-is (idempotent)
  if (Object.keys(updates).length === 0) {
    return res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
  }

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE tasks SET ${sets} WHERE id = ?`).run(...Object.values(updates), task.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

app.post('/api/tasks/reorder', auth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

  const update = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND user_id = ?');
  db.transaction(() => order.forEach((id, idx) => update.run(idx, id, req.user.id)))();
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('UPDATE tasks SET archived = 1 WHERE id = ?').run(task.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────
//  TIME ENTRIES
// ─────────────────────────────────────────

// IMPORTANT: Named routes MUST come before /:id wildcard

app.get('/api/entries/today', auth, (req, res) => {
  const entries = db.prepare(`
    SELECT e.*, t.name as task_name, t.color as task_color
    FROM time_entries e JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ? AND e.date = ? AND e.committed = 0
    ORDER BY e.start_time ASC
  `).all(req.user.id, todayDK());
  res.json(entries);
});

app.get('/api/entries/week-total', auth, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  const row = db.prepare(`
    SELECT COALESCE(SUM(seconds), 0) as total_seconds
    FROM time_entries
    WHERE user_id = ? AND date >= ? AND date <= ?
  `).get(req.user.id, from, to);
  res.json(row);
});

app.get('/api/entries/week-summary', auth, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  res.json(db.prepare(`
    SELECT e.date, e.task_id, t.name as task_name, t.color,
           SUM(e.seconds) as total_seconds, COUNT(*) as entry_count
    FROM time_entries e JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ? AND e.date >= ? AND e.date <= ?
    GROUP BY e.date, e.task_id
    ORDER BY e.date ASC
  `).all(req.user.id, from, to));
});

// ── EXPORT ──
// Returns entries grouped by date → tasks for PDF report generation
app.get('/api/export', auth, (req, res) => {
  const { from, to, customer } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(from) || !dateRe.test(to))
    return res.status(400).json({ error: 'Invalid date format' });
  if (from > to)
    return res.status(400).json({ error: 'from must be before to' });

  // Optional 6-digit customer number filter
  const customerFilter = customer ? customer.trim() : null;
  if (customerFilter && !/^\d{1,6}$/.test(customerFilter))
    return res.status(400).json({ error: 'Kundenummer skal være op til 6 cifre' });

  const rows = db.prepare(`
    SELECT e.date, t.name as task_name,
           SUM(e.seconds) as total_seconds
    FROM time_entries e
    JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ?
      AND e.date >= ? AND e.date <= ?
      ${customerFilter ? "AND t.name LIKE ?" : ''}
    GROUP BY e.date, e.task_id
    ORDER BY e.date ASC, t.name ASC
  `).all(...[req.user.id, from, to, ...(customerFilter ? [`${customerFilter}%`] : [])]);

  // When filtering by customer: group by task across all dates
  // When no filter: group by date (original behaviour)
  let grandTotal = 0;

  if (customerFilter) {
    // Group by task — show total per task over the whole period
    const byTask = {};
    for (const row of rows) {
      if (!byTask[row.task_name]) byTask[row.task_name] = 0;
      byTask[row.task_name] += row.total_seconds;
      grandTotal += row.total_seconds;
    }
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    return res.json({ from, to, userName: user.name, grandTotal,
                      customer: customerFilter, byTask, days: null });
  }

  // Default: group by date
  const byDate = {};
  for (const row of rows) {
    if (!byDate[row.date]) byDate[row.date] = { tasks: [], dayTotal: 0 };
    byDate[row.date].tasks.push({ name: row.task_name, seconds: row.total_seconds });
    byDate[row.date].dayTotal += row.total_seconds;
    grandTotal += row.total_seconds;
  }

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  res.json({ from, to, userName: user.name, grandTotal, customer: null, byTask: null, days: byDate });
});

// Autocomplete — returns distinct 6-digit customer numbers from user's tasks
app.get('/api/export/customers', auth, (req, res) => {
  const { q } = req.query;
  const rows = db.prepare(`
    SELECT DISTINCT substr(name, 1, 6) as customer, name
    FROM tasks
    WHERE user_id = ?
      AND name GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]*'
      ${q ? "AND name LIKE ?" : ''}
    ORDER BY name ASC
    LIMIT 20
  `).all(...[req.user.id, ...(q ? [`${q}%`] : [])]);

  // Deduplicate by customer number, keep one representative name
  const seen = {};
  for (const r of rows) {
    if (!seen[r.customer]) seen[r.customer] = r.name;
  }
  res.json(Object.entries(seen).map(([num, name]) => ({ num, name })));
});

app.get('/api/entries', auth, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });
  const entries = db.prepare(`
    SELECT e.*, t.name as task_name, t.color as task_color
    FROM time_entries e JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ? AND e.date >= ? AND e.date <= ?
    ORDER BY e.date ASC, e.start_time ASC
  `).all(req.user.id, from, to);
  res.json(entries);
});

app.post('/api/entries', auth, (req, res) => {
  const { task_id, date, start_time, end_time, note, committed } = req.body;
  if (!task_id || !date || !start_time || !end_time)
    return res.status(400).json({ error: 'Missing fields: task_id, date, start_time, end_time' });

  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const seconds = timeToSeconds(start_time, end_time);
  if (seconds <= 0) return res.status(400).json({ error: 'End time must be after start time' });

  const result = db.prepare(`
    INSERT INTO time_entries (user_id, task_id, date, start_time, end_time, seconds, note, committed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, task_id, date, start_time, end_time, seconds, note || '', committed ? 1 : 0);

  res.status(201).json(db.prepare(`
    SELECT e.*, t.name as task_name, t.color as task_color
    FROM time_entries e JOIN tasks t ON t.id = e.task_id WHERE e.id = ?
  `).get(result.lastInsertRowid));
});

app.post('/api/entries/end-day', auth, (req, res) => {
  const dk = todayDK();
  const uncommitted = db.prepare(
    'SELECT * FROM time_entries WHERE user_id = ? AND date = ? AND committed = 0'
  ).all(req.user.id, dk);

  if (uncommitted.length === 0) return res.json({ committed: 0, entries: [] });

  // Consolidate: one entry per task with accumulated total time.
  // start_time = earliest, end_time = latest, seconds = sum of all stops.
  const byTask = {};
  for (const e of uncommitted) {
    if (!byTask[e.task_id]) {
      byTask[e.task_id] = { start_time: e.start_time, end_time: e.end_time, seconds: 0, notes: [] };
    }
    const g = byTask[e.task_id];
    if (e.start_time < g.start_time) g.start_time = e.start_time;
    if (e.end_time   > g.end_time)   g.end_time   = e.end_time;
    g.seconds += e.seconds;
    if (e.note) g.notes.push(e.note);
  }

  const now = new Date().toISOString();
  const deleteUncommitted  = db.prepare('DELETE FROM time_entries WHERE user_id = ? AND date = ? AND committed = 0');
  const insertConsolidated = db.prepare(`
    INSERT INTO time_entries (user_id, task_id, date, start_time, end_time, seconds, note, committed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  db.transaction(() => {
    deleteUncommitted.run(req.user.id, dk);
    for (const [task_id, g] of Object.entries(byTask)) {
      insertConsolidated.run(req.user.id, parseInt(task_id), dk, g.start_time, g.end_time, g.seconds, g.notes.join(' / '), now, now);
    }
  })();

  res.json({
    committed: Object.keys(byTask).length,
    entries: db.prepare(`
      SELECT e.*, t.name as task_name, t.color as task_color
      FROM time_entries e JOIN tasks t ON t.id = e.task_id
      WHERE e.user_id = ? AND e.date = ? AND e.committed = 1 AND e.updated_at = ?
      ORDER BY e.start_time ASC
    `).all(req.user.id, dk, now)
  });
});

app.get('/api/entries/:id', auth, (req, res) => {
  const entry = db.prepare(`
    SELECT e.*, t.name as task_name, t.color as task_color
    FROM time_entries e JOIN tasks t ON t.id = e.task_id
    WHERE e.id = ? AND e.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

app.patch('/api/entries/:id', auth, (req, res) => {
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const { start_time, end_time, note, task_id, seconds } = req.body;
  const updates = {};

  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time   !== undefined) updates.end_time   = end_time;
  if (note       !== undefined) updates.note       = note;
  if (task_id    !== undefined) {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    updates.task_id = task_id;
  }

  // Allow direct seconds override (for edit-time dialog on active tasks)
  if (seconds !== undefined && !updates.start_time && !updates.end_time) {
    const s = parseInt(seconds);
    if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Invalid seconds value' });
    updates.seconds = s;
  } else {
    const newStart  = updates.start_time || entry.start_time;
    const newEnd    = updates.end_time   || entry.end_time;
    updates.seconds = timeToSeconds(newStart, newEnd);
    if (updates.seconds <= 0) return res.status(400).json({ error: 'End time must be after start time' });
  }

  updates.updated_at = new Date().toISOString();

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE time_entries SET ${sets} WHERE id = ?`).run(...Object.values(updates), entry.id);

  res.json(db.prepare(`
    SELECT e.*, t.name as task_name, t.color as task_color
    FROM time_entries e JOIN tasks t ON t.id = e.task_id WHERE e.id = ?
  `).get(entry.id));
});

app.delete('/api/entries/:id', auth, (req, res) => {
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(entry.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────

// GET all users with activity statistics
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const users = db.prepare(`
    SELECT
      u.id, u.email, u.name, u.role, u.created_at,
      u.day_end_hour, u.day_end_minute,
      -- Total tracked seconds all time
      COALESCE(SUM(e.seconds), 0)                                     AS total_seconds,
      -- Tracked seconds this week (Mon–Sun)
      COALESCE(SUM(CASE
        WHEN e.date >= date('now', 'weekday 1', '-7 days')
         AND e.date <= date('now')
        THEN e.seconds ELSE 0 END), 0)                                AS week_seconds,
      -- Tracked seconds today
      COALESCE(SUM(CASE
        WHEN e.date = date('now', 'localtime') THEN e.seconds ELSE 0
      END), 0)                                                        AS today_seconds,
      -- Last active date
      MAX(e.date)                                                     AS last_active,
      -- Total number of tasks
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id
       AND t.archived = 0)                                            AS task_count,
      -- Total entries
      COUNT(e.id)                                                     AS entry_count
    FROM users u
    LEFT JOIN time_entries e ON e.user_id = u.id
    GROUP BY u.id
    ORDER BY week_seconds DESC
  `).all();
  res.json(users);
});

// PATCH user — update role or name
app.patch('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const { role, name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Prevent demoting yourself
  if (String(user.id) === String(req.user.id) && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  const updates = [];
  const params = [];
  if (role && ['admin','user'].includes(role)) { updates.push('role = ?'); params.push(role); }
  if (name && name.trim()) { updates.push('name = ?'); params.push(name.trim()); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.params.id));
});

// PATCH reset password
app.patch('/api/admin/users/:id/password', auth, adminOnly, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  res.json({ ok: true });
});

// DELETE user — cascades to all tasks, entries, notes
app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (String(user.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET activity per user per day — for chart data
app.get('/api/admin/activity', auth, adminOnly, (req, res) => {
  const { days = 30 } = req.query;
  const n = Math.min(Math.max(parseInt(days) || 30, 7), 90);
  const rows = db.prepare(`
    SELECT
      u.id AS user_id, u.name, u.email,
      e.date,
      SUM(e.seconds) AS seconds
    FROM time_entries e
    JOIN users u ON u.id = e.user_id
    WHERE e.committed = 1
      AND e.date >= date('now', '-' || ? || ' days')
    GROUP BY u.id, e.date
    ORDER BY e.date ASC
  `).all(n);
  res.json({ days: n, rows });
});

// GET system stats
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  const stats = {
    users:       db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    tasks:       db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE archived = 0').get().n,
    entries:     db.prepare('SELECT COUNT(*) AS n FROM time_entries').get().n,
    total_hours: Math.round(
      (db.prepare('SELECT COALESCE(SUM(seconds),0) AS n FROM time_entries WHERE committed=1').get().n) / 3600
    ),
    active_today: db.prepare(
      "SELECT COUNT(DISTINCT user_id) AS n FROM time_entries WHERE date = date('now','localtime')"
    ).get().n,
    db_size_kb: Math.round(
      require('fs').statSync(process.env.DB_PATH ||
        require('path').join(__dirname, '../data/tasktimer.db')).size / 1024
    ),
  };
  res.json(stats);
});

// ─────────────────────────────────────────
//  NOTES (BOX)
// ─────────────────────────────────────────

const VALID_COLORS = ['default','red','orange','green','blue','purple'];

// GET all notes for user (supports ?q= search)
app.get('/api/notes', auth, (req, res) => {
  const { q } = req.query;
  let notes;
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    notes = db.prepare(`
      SELECT * FROM notes
      WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
      ORDER BY pinned DESC, updated_at DESC
    `).all(req.user.id, term, term);
  } else {
    notes = db.prepare(`
      SELECT * FROM notes
      WHERE user_id = ?
      ORDER BY pinned DESC, updated_at DESC
    `).all(req.user.id);
  }
  res.json(notes);
});

// POST create note
app.post('/api/notes', auth, (req, res) => {
  const { title = 'Untitled', content = '', color = 'default', pinned = 0 } = req.body;
  if (!VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  const result = db.prepare(`
    INSERT INTO notes (user_id, title, content, color, pinned)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, title.trim() || 'Untitled', content, color, pinned ? 1 : 0);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.json(note);
});

// PATCH update note
app.patch('/api/notes/:id', auth, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const title   = req.body.title   !== undefined ? (req.body.title.trim() || 'Untitled') : note.title;
  const content = req.body.content !== undefined ? req.body.content : note.content;
  const color   = req.body.color   !== undefined ? req.body.color   : note.color;
  const pinned  = req.body.pinned  !== undefined ? (req.body.pinned ? 1 : 0) : note.pinned;

  if (!VALID_COLORS.includes(color)) return res.status(400).json({ error: 'Invalid color' });

  db.prepare(`
    UPDATE notes SET title=?, content=?, color=?, pinned=?, updated_at=datetime('now')
    WHERE id=?
  `).run(title, content, color, pinned, note.id);

  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id));
});

// DELETE note
app.delete('/api/notes/:id', auth, (req, res) => {
  const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────
//  API KEY MANAGEMENT
// ─────────────────────────────────────────

// Generate a new API key for the current user
app.post('/api/auth/api-key', auth, (req, res) => {
  const raw = crypto.randomBytes(32).toString('hex'); // 64-char key shown to user once
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(hashed, req.user.id);
  // Return the raw key — only time it's ever visible
  res.json({ key: raw, message: 'Gem denne nøgle — den vises kun én gang.' });
});

// Revoke API key
app.delete('/api/auth/api-key', auth, (req, res) => {
  db.prepare('UPDATE users SET api_key = NULL WHERE id = ?').run(req.user.id);
  res.json({ ok: true });
});

// Check if user has an API key (without revealing it)
app.get('/api/auth/api-key', auth, (req, res) => {
  const user = db.prepare('SELECT api_key FROM users WHERE id = ?').get(req.user.id);
  res.json({ hasKey: !!user.api_key });
});

// ─────────────────────────────────────────
//  EXTENSION ENDPOINTS (JWT or ApiKey)
// ─────────────────────────────────────────

// Quick-create task — used by Chrome extension
// Sets pending_start=1 so TaskTimer web app auto-starts timer on next poll
app.post('/api/extension/task', authOrApiKey, (req, res) => {
  const { name, start_timer = false } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Task name required' });

  // New tasks go to the top — see /api/tasks rationale.
  const minOrder = db.prepare('SELECT MIN(sort_order) as m FROM tasks WHERE user_id = ?').get(req.user.id);
  const result = db.prepare(
    'INSERT INTO tasks (user_id, name, color, sort_order, budget_seconds, pending_start) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(req.user.id, name.trim(), '#f07c28', (minOrder.m ?? 0) - 1, start_timer ? 1 : 0);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task, start_timer });
});

// Poll endpoint — TaskTimer calls this every few seconds to check for pending auto-starts
// Returns tasks with pending_start=1 and clears the flag atomically
app.get('/api/extension/pending', auth, (req, res) => {
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? AND pending_start = 1'
  ).all(req.user.id);

  if (tasks.length > 0) {
    db.prepare(
      'UPDATE tasks SET pending_start = 0 WHERE user_id = ? AND pending_start = 1'
    ).run(req.user.id);
  }

  res.json(tasks);
});

// Get tasks list — for extension to show existing tasks
app.get('/api/extension/tasks', authOrApiKey, (req, res) => {
  const tasks = db.prepare(`
    SELECT id, name, color FROM tasks
    WHERE user_id = ? AND archived = 0
    ORDER BY sort_order ASC, created_at ASC
  `).all(req.user.id);
  res.json(tasks);
});

// ─────────────────────────────────────────
//  BACKGROUND IMAGES
// ─────────────────────────────────────────

app.get('/api/background-images', auth, (req, res) => {
  const uid = String(req.user.id);
  let files;
  try { files = fs.readdirSync(UPLOADS_DIR); } catch { files = []; }
  const imgs = files
    .filter(f => f.startsWith(`bg_${uid}_`) && f.endsWith('.jpg'))
    .sort((a, b) => {
      const ta = parseInt(a.split('_')[2]) || 0;
      const tb = parseInt(b.split('_')[2]) || 0;
      return tb - ta;
    })
    .map(f => ({ filename: f, url: `/uploads/${f}` }));
  res.json(imgs);
});

app.post('/api/background-images', auth, (req, res) => {
  // Run multer manually so we can return its errors as JSON instead of
  // letting Express fall through to its default HTML error page.
  upload.single('image')(req, res, (err) => {
    if (err) {
      const cl = parseInt(req.headers['content-length'] || '0', 10);
      const mb = (cl / 1048576).toFixed(1);
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? `Image too large (received ~${mb}MB, max 25MB)`
        : (err.message || 'Upload failed');
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const uid = String(req.user.id);
    let existing;
    try { existing = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(`bg_${uid}_`)); } catch { existing = []; }
    if (existing.length >= 10) return res.status(400).json({ error: 'Max 10 background images allowed' });

    const filename = `bg_${uid}_${Date.now()}.jpg`;
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
    } catch (e) {
      console.error('[TaskTimer] Failed to save background image:', e.message);
      return res.status(500).json({ error: 'Could not save the image on the server' });
    }
    res.json({ filename, url: `/uploads/${filename}` });
  });
});

app.delete('/api/background-images/:filename', auth, (req, res) => {
  const uid = String(req.user.id);
  const { filename } = req.params;
  if (!filename.startsWith(`bg_${uid}_`) || /[/\\]/.test(filename)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const filepath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filepath);
  res.json({ ok: true });
});

// ─────────────────────────────────────────
//  SPA FALLBACK
// ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// ── JSON ERROR HANDLER ──
// Safety net: ensure API routes always return JSON, never an HTML error page.
// Without this, an unhandled error (e.g. multer) yields "<!DOCTYPE ..." which
// breaks the frontend's response.json() with "Unexpected token '<'".
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('[TaskTimer] Unhandled error:', err.message);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TaskTimer API running on port ${PORT}`);
});
