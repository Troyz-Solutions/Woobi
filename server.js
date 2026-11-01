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

function getUserStreakRecord(userId, allData = null) {
  const store = allData || loadAllStreaks();
  let userRecord = store[userId];
  const now = Date.now();

  if (!userRecord) {
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
    if (userRecord.currentStreak > 0) {
      userRecord.savedPreviousStreak = userRecord.currentStreak;
    }
    userRecord.currentStreak = 0;
    userRecord.streakStatus = 'broken';
    userRecord.isPeriodCredited = false;
    userRecord.breakNotified = false;
    store[userId] = userRecord;
    saveAllStreaks(store);
  }

  return userRecord;
}

// MIME types dictionary for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function parseJsonBody(req, limitBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > limitBytes) {
        reject(new Error('Payload Too Large'));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON Payload'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const [pathname, queryString] = req.url.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // =========================================================================
  // API ROUTING: /api/streak/...
  // =========================================================================

  // 1. GET /api/streak/time - Server Time Synchronization
  if (pathname === '/api/streak/time' && req.method === 'GET') {
    return sendJson(res, 200, {
      serverTime: Date.now(),
      iso: new Date().toISOString()
    });
  }

  // 2. GET /api/streak - Get User Streak Status
  if (pathname === '/api/streak' && req.method === 'GET') {
    const userId = queryParams.get('userId') || 'user_default';
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

  // 3. POST /api/streak/upload - Qualifying & Additional Outfit Photo Upload
  if (pathname === '/api/streak/upload' && req.method === 'POST') {
    let payload;
    try {
      payload = await parseJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }

    const userId = payload.userId || 'user_default';
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

      // Save photo to file system
      const photoFileName = `outfit_${userId}_${now}_${crypto.randomBytes(4).toString('hex')}${extension}`;
      const photoFilePath = path.join(UPLOADS_DIR, photoFileName);
      fs.writeFileSync(photoFilePath, buffer);
      const relativePhotoUrl = `/uploads/streaks/${photoFileName}`;

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
        record.breakNotified = false;
        qualifiesForIncrement = true;
        streakMessage = 'First outfit photo uploaded! Streak started at 1 Day 🔥';
      } else if (record.streakStatus === 'restored') {
        // Restored streak upload within the fresh 24h window
        record.currentStreak += 1;
        record.savedPreviousStreak = record.currentStreak;
        record.lastCreditedUploadTimestamp = now;
        record.deadline = now + DEADLINE_WINDOW_MS;
        record.isPeriodCredited = true;
        record.streakStatus = 'active';
        record.breakNotified = false;
        qualifiesForIncrement = true;
        streakMessage = `Streak continued! Streak increased to ${record.currentStreak} Days 🔥`;
      } else {
        // Active streak: check whether current 24-hour period has elapsed
        const timeSinceLastCredited = record.lastCreditedUploadTimestamp
          ? now - record.lastCreditedUploadTimestamp
          : DEADLINE_WINDOW_MS;

        if (timeSinceLastCredited < REMINDER_THRESHOLD_MS && record.isPeriodCredited) {
          // Within the initial period (0 to 20h): multiple uploads MUST NOT increase streak
          qualifiesForIncrement = false;
          streakMessage = `Photo saved to gallery! Streak already credited for this 24-hour period (🔥 ${record.currentStreak} Days).`;
        } else if (now <= record.deadline) {
          // Qualifying upload in the next 24-hour window (20h to 24h before deadline)
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

  // 4. POST /api/streak/break - Mark streak as broken
  if (pathname === '/api/streak/break' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}
    const userId = payload.userId || 'user_default';

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      if (record.streakStatus !== 'broken') {
        if (record.currentStreak > 0) {
          record.savedPreviousStreak = record.currentStreak;
        }
        record.currentStreak = 0;
        record.streakStatus = 'broken';
        record.isPeriodCredited = false;
        record.breakNotified = true;
        store[userId] = record;
        saveAllStreaks(store);
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

  // 5. POST /api/streak/restore - Restore streak with strict rolling 30-day limit
  if (pathname === '/api/streak/restore' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}
    const userId = payload.userId || 'user_default';

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

  // 6. POST /api/streak/start-again - Start streak fresh from 0
  if (pathname === '/api/streak/start-again' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}
    const userId = payload.userId || 'user_default';

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

  // 7. GET /api/streak/gallery - Get full user outfit gallery
  if (pathname === '/api/streak/gallery' && req.method === 'GET') {
    const userId = queryParams.get('userId') || 'user_default';
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

  // 8. POST /api/streak/dev-simulate - Developer / Automated Test Simulation Endpoint
  if (pathname === '/api/streak/dev-simulate' && req.method === 'POST') {
    let payload = {};
    try { payload = await parseJsonBody(req); } catch (e) {}
    const userId = payload.userId || 'user_default';
    const action = payload.action;

    const release = await acquireLock(userId);
    try {
      const store = loadAllStreaks();
      const record = getUserStreakRecord(userId, store);
      const now = Date.now();

      if (action === 'set-20h-elapsed') {
        // Move lastCreditedUploadTimestamp to 20 hours ago, deadline to 4 hours in future
        record.lastCreditedUploadTimestamp = now - REMINDER_THRESHOLD_MS;
        record.deadline = now + (4 * 3600 * 1000);
        record.isPeriodCredited = true;
        record.streakStatus = 'active';
      } else if (action === 'set-deadline-expired') {
        // Expire deadline immediately
        record.deadline = now - 1000;
        if (record.currentStreak > 0) record.savedPreviousStreak = record.currentStreak;
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  AURA Wardrobe is running live:`);
  console.log(`  > Local:   http://localhost:${PORT}/`);
  console.log(`  > Network: http://127.0.0.1:${PORT}/`);
  console.log(`======================================================\n`);
});
