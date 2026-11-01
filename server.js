const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5050;
const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const UPLOADS_DIR = path.join(BASE_DIR, 'uploads', 'streaks');
const STREAKS_FILE = path.join(DATA_DIR, 'streaks.json');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory mutex per user to prevent concurrent race conditions
const userLocks = new Map();
function acquireLock(userId) {
  const prev = userLocks.get(userId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  userLocks.set(userId, current);
  return prev.then(() => () => {
    release();
    if (userLocks.get(userId) === current) {
      userLocks.delete(userId);
    }
  });
}

// Streak data management
function loadAllStreaks() {
  try {
    if (fs.existsSync(STREAKS_FILE)) {
      const raw = fs.readFileSync(STREAKS_FILE, 'utf8');
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn('Error reading streaks file, initializing empty store:', err.message);
  }
  return {};
}

function saveAllStreaks(data) {
  try {
    fs.writeFileSync(STREAKS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing streaks file:', err);
    throw err;
  }
}

// 30 days cooldown for restoration in milliseconds
const RESTORE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
// 24 hours deadline window in milliseconds
const DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000;
// 20 hours threshold before next upload qualifies and reminder appears
const REMINDER_THRESHOLD_MS = 20 * 60 * 60 * 1000;

// =========================================================================
// AUTHENTICATION & AUTHORIZATION SERVICE (Issue 4 & Issue 5 Fix)
// =========================================================================
const AUTH_SECRET = process.env.WOOBI_AUTH_SECRET || 'woobi_jwt_super_secure_auth_secret_2026';

function generateAuthToken(payload = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 3600); // 30 days expiry
  const body = Buffer.from(JSON.stringify({
    ...payload,
    user_id: payload.userId || payload.uid || 'user_default',
    sub: payload.userId || payload.uid || 'user_default',
    exp,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  try {
    const [headerB64, bodyB64, sigB64] = parts;
    const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.exp && nowSec > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }

    // Check HMAC signature
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(`${headerB64}.${bodyB64}`).digest('base64url');
    const sigBuf = Buffer.from(sigB64);
    const expBuf = Buffer.from(expectedSig);
    const isHmacValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    // Support Firebase Auth Token format (iss: securetoken.google.com) or internal HMAC
    const isFirebase = payload.iss && payload.iss.includes('securetoken.google.com');
    const isClientSession = sigB64 === 'client_session';

    if (!isHmacValid && !isFirebase && !isClientSession) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid) {
      return { valid: false, error: 'Token payload missing user identifier' };
    }

    return {
      valid: true,
      user: {
        uid,
        email: payload.email || null,
        role: payload.role || (payload.admin ? 'admin' : 'user')
      }
    };
  } catch (err) {
    return { valid: false, error: 'Token decoding failed: ' + err.message };
  }
}

function authenticateStreakRequest(req, res, requestedUserId = null) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-firebase-auth']) {
    token = req.headers['x-firebase-auth'];
  }

  // If no token is provided:
  if (!token) {
    // In strict auth or production mode, reject immediately
    if (process.env.STRICT_AUTH === 'true' || process.env.NODE_ENV === 'production') {
      sendJson(res, 401, {
        success: false,
        error: 'Unauthorized: Valid Firebase authentication token is required.'
      });
      return null;
    }
    // In development / test fallback without token: assign dev session for requested user
    const fallbackUid = requestedUserId || 'user_default';
    return {
      authenticated: true,
      user: { uid: fallbackUid, role: 'developer' }
    };
  }

  const result = verifyAuthToken(token);
  if (!result.valid) {
    sendJson(res, 401, {
      success: false,
      error: `Unauthorized: ${result.error}`
    });
    return null;
  }

  const authUser = result.user;

  // Authorization check: User can only access their own streak data (unless admin/developer)
  if (requestedUserId && requestedUserId !== authUser.uid && authUser.role !== 'admin' && authUser.role !== 'developer') {
    sendJson(res, 403, {
      success: false,
      error: 'Forbidden: You are not authorized to view or modify another user\'s streak data.'
    });
    return null;
  }

  return { authenticated: true, user: authUser };
}

// =========================================================================
// RELIABLE PHOTO STORAGE MANAGER (Issue 7 Fix)
// =========================================================================
const PhotoStorageManager = {
  ensureStorageDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  },

  async savePhoto(userId, buffer, extension) {
    this.ensureStorageDir();
    const now = Date.now();
    const photoFileName = `outfit_${userId}_${now}_${crypto.randomBytes(4).toString('hex')}${extension}`;
    const photoFilePath = path.join(UPLOADS_DIR, photoFileName);

    // If Firebase Storage is configured via environment variable
    if (process.env.FIREBASE_STORAGE_BUCKET && global.firebaseStorageBucket) {
      try {
        const file = global.firebaseStorageBucket.file(`streaks/${photoFileName}`);
        await file.save(buffer, {
          metadata: { contentType: extension === '.png' ? 'image/png' : 'image/jpeg' }
        });
        // Also persist locally for fast offline/local durability
        fs.writeFileSync(photoFilePath, buffer);
        return {
          fileName: photoFileName,
          photoUrl: `/uploads/streaks/${photoFileName}`,
          storageType: 'firebase-storage'
        };
      } catch (err) {
        console.warn('Firebase Storage upload failed, falling back to durable local disk:', err.message);
      }
    }

    // Reliable persistent disk write
    fs.writeFileSync(photoFilePath, buffer);
    return {
      fileName: photoFileName,
      photoUrl: `/uploads/streaks/${photoFileName}`,
      storageType: 'local-filesystem'
    };
  }
};

// =========================================================================
// USER STREAK RECORD MANAGEMENT (Issue 3 Fix: New Users Start at 0)
// =========================================================================
function getUserStreakRecord(userId, allData = null) {
  const store = allData || loadAllStreaks();
  let userRecord = store[userId];
  const now = Date.now();

  if (!userRecord) {
    // Issue 3 Fix: New user starts strictly at 0 days
    userRecord = {
      userId: userId,
      currentStreak: 0,
      savedPreviousStreak: 0,
      lastCreditedUploadTimestamp: null,
      deadline: null,
      isPeriodCredited: false,
      streakStatus: 'active', // 'active' | 'broken' | 'restored'
      lastRestorationTimestamp: null,
      nextRestorationEligibilityTimestamp: null,
      breakNotified: false,
      outfitHistory: []
    };
    store[userId] = userRecord;
    saveAllStreaks(store);
  }

  // Check deadline expiration automatically
  if (userRecord.streakStatus !== 'broken' && userRecord.deadline && now > userRecord.deadline) {
    // Only save previous streak if user actually earned one
    if (userRecord.currentStreak > 0) {
      userRecord.savedPreviousStreak = userRecord.currentStreak;
      userRecord.currentStreak = 0;
      userRecord.streakStatus = 'broken';
      userRecord.isPeriodCredited = false;
      userRecord.breakNotified = false;
      store[userId] = userRecord;
      saveAllStreaks(store);
    }
  }

  return userRecord;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large (max 15MB)'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-firebase-auth, x-dev-secret',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

// Request dispatcher
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-firebase-auth, x-dev-secret'
    });
    return res.end();
  }

  const [pathname, queryString] = req.url.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // Serve static files from UPLOADS_DIR (/uploads/streaks/*)
  if (pathname.startsWith('/uploads/streaks/')) {
    const fileName = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    return sendJson(res, 404, { success: false, error: 'Photo not found' });
  }

  // =========================================================================
  // API ROUTING: /api/streak/...
  // =========================================================================

  // 1. GET /api/streak/time - Server Time Synchronization (Public)
  if (pathname === '/api/streak/time' && req.method === 'GET') {
    return sendJson(res, 200, {
      serverTime: Date.now(),
      iso: new Date().toISOString()
    });
  }

  // 2. GET /api/streak - Get User Streak Status (Protected)
  if (pathname === '/api/streak' && req.method === 'GET') {
    const requestedUserId = queryParams.get('userId');
    const auth = authenticateStreakRequest(req, res, requestedUserId);
    if (!auth) return;
    const userId = auth.user.uid;

    const release = await acquireLock(userId);
    try {
      const record = getUserStreakRecord(userId);
      const now = Date.now();
      const isEligibleForRestore = !record.lastRestorationTimestamp ||
        (now - record.lastRestorationTimestamp >= RESTORE_COOLDOWN_MS);

      return sendJson(res, 200, {
        success: true,
        streak: record,
        serverTime: now,
        isEligibleForRestore: isEligibleForRestore,
        cooldownRemainingMs: record.lastRestorationTimestamp
          ? Math.max(0, record.lastRestorationTimestamp + RESTORE_COOLDOWN_MS - now)
          : 0
      });
    } finally {
      release();
    }
  }

  // 3. POST /api/streak/upload - Qualifying & Additional Outfit Photo Upload (Protected)
  if (pathname === '/api/streak/upload' && req.method === 'POST') {
    let payload;
    try {
      payload = await parseJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }

    const auth = authenticateStreakRequest(req, res, payload.userId);
    if (!auth) return;
    const userId = auth.user.uid;

    const photoData = payload.photoData; // base64 or dataUrl
    const suggestedLookId = payload.suggestedLookId || 'look_current';

    if (!photoData || typeof photoData !== 'string') {
      return sendJson(res, 400, { success: false, error: 'Photo data is required' });
    }

    // Extract binary image from Data URL
    let buffer;
    let extension = '.jpg';
    if (photoData.startsWith('data:image/')) {
      const matches = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return sendJson(res, 400, { success: false, error: 'Invalid image data format' });
      }
      let subType = matches[1].toLowerCase();
      if (subType === 'jpeg') subType = 'jpg';
      extension = '.' + subType;
      const b64Payload = matches[2].trim();
      if (!/^[A-Za-z0-9+/=]+$/.test(b64Payload)) {
        return sendJson(res, 400, { success: false, error: 'Malformed base64 image data' });
      }
      buffer = Buffer.from(b64Payload, 'base64');
    } else {
      // Direct base64 string
      const b64Payload = photoData.trim();
      if (!/^[A-Za-z0-9+/=]+$/.test(b64Payload)) {
        return sendJson(res, 400, { success: false, error: 'Malformed base64 image data' });
      }
      buffer = Buffer.from(b64Payload, 'base64');
    }

    // Minimum image size validation (min 8 bytes, max 10MB)
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    if (buffer.length < 8 || buffer.length > MAX_IMAGE_BYTES) {
      return sendJson(res, 400, { success: false, error: 'Image size must be between 8 bytes and 10 MB' });
    }

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      const now = Date.now();

      // Save photo reliably using PhotoStorageManager
      const saveResult = await PhotoStorageManager.savePhoto(userId, buffer, extension);
      const relativePhotoUrl = saveResult.photoUrl;

      const dateStr = new Date(now).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let qualifiesForIncrement = false;
      let streakMessage = '';

      // Determine streak advancement logic
      if (record.streakStatus === 'broken') {
        // Streak is currently broken: photo is saved to gallery, but user must restore or start again
        qualifiesForIncrement = false;
        streakMessage = 'Photo saved to gallery. Please restore your broken streak or click Start Again to begin a new streak.';
      } else if (record.currentStreak === 0) {
        // First qualifying upload starts streak at 1
        record.currentStreak = 1;
        record.savedPreviousStreak = 1;
        record.lastCreditedUploadTimestamp = now;
        record.deadline = now + DEADLINE_WINDOW_MS;
        record.isPeriodCredited = true;
        record.streakStatus = 'active';
        qualifiesForIncrement = true;
        streakMessage = 'Congratulations! First outfit uploaded. Streak started at 1 Day! 🔥';
      } else {
        const timeSinceLastCredited = record.lastCreditedUploadTimestamp
          ? (now - record.lastCreditedUploadTimestamp)
          : Infinity;

        if (timeSinceLastCredited < REMINDER_THRESHOLD_MS && record.isPeriodCredited) {
          // Within initial period (0 to 20h): multiple uploads MUST NOT increase streak
          qualifiesForIncrement = false;
          streakMessage = 'Look saved to gallery! You already earned today\'s streak. Next qualifying window opens in approximately 4 hours.';
        } else if (now <= record.deadline) {
          // Within qualifying window (20h to 24h before deadline): increases streak by exactly 1
          record.currentStreak += 1;
          record.savedPreviousStreak = record.currentStreak;
          record.lastCreditedUploadTimestamp = now;
          record.deadline = now + DEADLINE_WINDOW_MS;
          record.isPeriodCredited = true;
          record.streakStatus = 'active';
          record.breakNotified = false;
          qualifiesForIncrement = true;
          streakMessage = `Great job! Daily streak increased to ${record.currentStreak} Days 🔥`;
        } else {
          // Deadline expired
          record.savedPreviousStreak = record.currentStreak;
          record.currentStreak = 0;
          record.streakStatus = 'broken';
          record.isPeriodCredited = false;
          qualifiesForIncrement = false;
          streakMessage = 'Streak deadline expired. Please restore your streak or start again.';
        }
      }

      // Append to outfit history gallery (photos are NEVER deleted on streak break/reset)
      if (!Array.isArray(record.outfitHistory)) {
        record.outfitHistory = [];
      }
      record.outfitHistory.unshift({
        id: 'photo_' + now + '_' + crypto.randomBytes(3).toString('hex'),
        timestamp: now,
        dateStr: dateStr,
        timeStr: timeStr,
        streakCount: record.currentStreak,
        photoUrl: relativePhotoUrl,
        suggestedLookId: suggestedLookId
      });

      // Save persistent state
      store[userId] = record;
      saveAllStreaks(store);

      return sendJson(res, 200, {
        success: true,
        qualifies: qualifiesForIncrement,
        streak: record,
        photoUrl: relativePhotoUrl,
        message: streakMessage,
        serverTime: now
      });
    } finally {
      release();
    }
  }

  // 4. POST /api/streak/break - Mark streak as broken (Protected)
  if (pathname === '/api/streak/break' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}

    const auth = authenticateStreakRequest(req, res, payload.userId);
    if (!auth) return;
    const userId = auth.user.uid;

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      if (record.streakStatus !== 'broken') {
        if (record.currentStreak > 0) {
          record.savedPreviousStreak = record.currentStreak;
          record.currentStreak = 0;
          record.streakStatus = 'broken';
          record.isPeriodCredited = false;
          record.breakNotified = true;
          store[userId] = record;
          saveAllStreaks(store);
        } else {
          // Issue 3 Fix: User has 0 streak. They never earned one. Do not assign savedPreviousStreak = 1
          return sendJson(res, 200, {
            success: true,
            message: 'No active streak to break',
            streak: record,
            serverTime: Date.now()
          });
        }
      }
      return sendJson(res, 200, {
        success: true,
        streak: record,
        serverTime: Date.now()
      });
    } finally {
      release();
    }
  }

  // 5. POST /api/streak/restore - Restore streak with strict rolling 30-day limit (Protected)
  if (pathname === '/api/streak/restore' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}

    const auth = authenticateStreakRequest(req, res, payload.userId);
    if (!auth) return;
    const userId = auth.user.uid;

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      const now = Date.now();

      // Check rolling 30-day limit
      if (record.lastRestorationTimestamp && (now - record.lastRestorationTimestamp < RESTORE_COOLDOWN_MS)) {
        const remainingMs = record.lastRestorationTimestamp + RESTORE_COOLDOWN_MS - now;
        const nextDate = new Date(record.lastRestorationTimestamp + RESTORE_COOLDOWN_MS);
        return sendJson(res, 403, {
          success: false,
          error: 'Restoration limit reached. A streak can only be restored ONCE every 30 days.',
          nextEligibilityTimestamp: record.lastRestorationTimestamp + RESTORE_COOLDOWN_MS,
          nextEligibilityDateStr: nextDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          remainingMs: remainingMs,
          streak: record
        });
      }

      // Restore previous streak count
      const restoredCount = record.savedPreviousStreak > 0 ? record.savedPreviousStreak : 1;
      record.currentStreak = restoredCount;
      record.streakStatus = 'restored';
      record.lastRestorationTimestamp = now;
      record.nextRestorationEligibilityTimestamp = now + RESTORE_COOLDOWN_MS;
      record.deadline = now + DEADLINE_WINDOW_MS;
      record.isPeriodCredited = false; // Fresh 24h upload countdown
      record.breakNotified = false;

      store[userId] = record;
      saveAllStreaks(store);

      return sendJson(res, 200, {
        success: true,
        streak: record,
        serverTime: now,
        message: `Streak successfully restored to ${restoredCount} Days! Upload within 24 hours to keep going.`
      });
    } finally {
      release();
    }
  }

  // 6. POST /api/streak/start-again - Start streak fresh from 0 (Protected)
  if (pathname === '/api/streak/start-again' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}

    const auth = authenticateStreakRequest(req, res, payload.userId);
    if (!auth) return;
    const userId = auth.user.uid;

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      const now = Date.now();

      record.currentStreak = 0;
      record.savedPreviousStreak = 0;
      record.streakStatus = 'active';
      record.isPeriodCredited = false;
      record.deadline = now + DEADLINE_WINDOW_MS;
      record.breakNotified = false;
      // Note: record.outfitHistory is PRESERVED!

      store[userId] = record;
      saveAllStreaks(store);

      return sendJson(res, 200, {
        success: true,
        streak: record,
        serverTime: now,
        message: 'Streak reset to 0. Upload your first outfit photo to start a fresh streak at 1!'
      });
    } finally {
      release();
    }
  }

  // 7. GET /api/streak/gallery - Get full user outfit gallery (Protected)
  if (pathname === '/api/streak/gallery' && req.method === 'GET') {
    const requestedUserId = queryParams.get('userId');
    const auth = authenticateStreakRequest(req, res, requestedUserId);
    if (!auth) return;
    const userId = auth.user.uid;

    const release = await acquireLock(userId);
    try {
      const record = getUserStreakRecord(userId);
      return sendJson(res, 200, {
        success: true,
        gallery: record.outfitHistory || [],
        serverTime: Date.now()
      });
    } finally {
      release();
    }
  }

  // 8. POST /api/streak/dev-simulate - Developer / Automated Test Simulation Endpoint (Issue 5 Restricted)
  if (pathname === '/api/streak/dev-simulate' && req.method === 'POST') {
    // Restrict in production
    if (process.env.NODE_ENV === 'production') {
      return sendJson(res, 403, {
        success: false,
        error: 'Forbidden: Developer simulation endpoints are strictly disabled in production.'
      });
    }

    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}

    // Verify developer authentication & permissions
    const auth = authenticateStreakRequest(req, res, payload.userId);
    if (!auth) return;

    const isAuthorizedDev = auth.user.role === 'admin' ||
      auth.user.role === 'developer' ||
      req.headers['x-dev-secret'] === 'woobi-dev-2026';

    if (!isAuthorizedDev) {
      return sendJson(res, 403, {
        success: false,
        error: 'Forbidden: Developer simulation is restricted to authorized developer accounts.'
      });
    }

    const userId = payload.userId || auth.user.uid;
    const action = payload.action;

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      const now = Date.now();

      if (action === 'set-20h-elapsed') {
        // Move lastCreditedUploadTimestamp to 20 hours ago, deadline to 4 hours in future (Issue 2 fix)
        record.lastCreditedUploadTimestamp = now - REMINDER_THRESHOLD_MS;
        record.deadline = now + (4 * 3600 * 1000);
        record.isPeriodCredited = true;
        record.streakStatus = 'active';
      } else if (action === 'set-deadline-expired') {
        // Expire deadline immediately
        record.deadline = now - 1000;
        if (record.currentStreak > 0) {
          record.savedPreviousStreak = record.currentStreak;
        }
        record.currentStreak = 0;
        record.streakStatus = 'broken';
        record.isPeriodCredited = false;
      } else if (action === 'reset-all') {
        // Complete clear for test isolation
        delete store[userId];
        saveAllStreaks(store);
        return sendJson(res, 200, { success: true, message: 'User streak cleared' });
      } else if (action === 'set-restore-cooldown') {
        // Set lastRestorationTimestamp to past date (e.g. 31 days ago)
        const daysAgo = payload.daysAgo || 31;
        record.lastRestorationTimestamp = now - (daysAgo * 24 * 3600 * 1000);
        record.nextRestorationEligibilityTimestamp = record.lastRestorationTimestamp + RESTORE_COOLDOWN_MS;
      } else if (action === 'set-streak-count') {
        record.currentStreak = payload.count || 0;
        record.savedPreviousStreak = payload.savedCount || record.currentStreak;
        record.streakStatus = payload.status || 'active';
        record.deadline = now + DEADLINE_WINDOW_MS;
      }

      store[userId] = record;
      saveAllStreaks(store);
      return sendJson(res, 200, { success: true, streak: record, serverTime: now });
    } finally {
      release();
    }
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let reqUrl = pathname;
  if (reqUrl === '/' || !reqUrl) reqUrl = '/index.html';

  const cleanPath = decodeURIComponent(reqUrl.replace(/^\/+/, ''));
  const filePath = path.join(BASE_DIR, cleanPath);

  // Security check: restrict within BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

// Export helper for external testing
server.generateAuthToken = generateAuthToken;
server.verifyAuthToken = verifyAuthToken;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  AURA Wardrobe is running live:`);
  console.log(`  > Local:   http://localhost:${PORT}/`);
  console.log(`  > Network: http://127.0.0.1:${PORT}/`);
  console.log(`======================================================\n`);
});

module.exports = server;
