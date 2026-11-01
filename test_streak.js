const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple 1x1 transparent PNG base64 for test uploads
const DUMMY_PNG_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const TEST_PORT = 5058;
process.env.PORT = TEST_PORT;
process.env.NODE_ENV = 'test';

// Start server instance for testing
const serverPath = path.join(__dirname, 'server.js');
delete require.cache[require.resolve(serverPath)];
const serverInstance = require(serverPath);

function request(method, path, body = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...customHeaders
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('  RUNNING WOOBI STREAK & SECURITY ACCEPTANCE TESTS');
  console.log('======================================================\n');

  const testUserId = 'test_user_' + Date.now();
  const testUserToken = serverInstance.generateAuthToken({ userId: testUserId, role: 'user' });
  const devToken = serverInstance.generateAuthToken({ userId: 'dev_admin', role: 'developer' });

  const userHeaders = { 'Authorization': `Bearer ${testUserToken}` };
  const devHeaders = { 'Authorization': `Bearer ${devToken}`, 'x-dev-secret': 'woobi-dev-2026' };

  try {
    // Setup: Reset test user
    await request('POST', '/api/streak/dev-simulate', { userId: testUserId, action: 'reset-all' }, devHeaders);

    // -----------------------------------------------------------------------
    // TEST 1: First upload changes streak from 0 to 1
    // -----------------------------------------------------------------------
    console.log('--- Test 1: First upload changes streak from 0 to 1 ---');
    const resInitial = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    assert(resInitial.data.streak.currentStreak === 0, 'Initial streak is 0');
    assert(resInitial.data.streak.savedPreviousStreak === 0, 'Initial saved previous streak is 0 (Issue 3 check)');

    const resUpload1 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);

    assert(resUpload1.status === 200, 'Upload 1 status is 200');
    assert(resUpload1.data.qualifies === true, 'Upload 1 qualifies for streak increment');
    assert(resUpload1.data.streak.currentStreak === 1, 'Upload 1 increased streak to 1');
    assert(resUpload1.data.streak.streakStatus === 'active', 'Streak status is active');
    assert(resUpload1.data.streak.deadline > Date.now(), 'Deadline is set to +24 hours');
    assert(resUpload1.data.streak.outfitHistory.length === 1, '1 photo in gallery history');

    // -----------------------------------------------------------------------
    // TEST 2: Multiple uploads in the same 24-hour period count only once
    // -----------------------------------------------------------------------
    console.log('\n--- Test 2: Multiple uploads in the same 24-hour period count only once ---');
    const resUpload2 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);
    assert(resUpload2.status === 200, 'Second upload status is 200');
    assert(resUpload2.data.qualifies === false, 'Second upload within same 24h does NOT qualify for streak increment');
    assert(resUpload2.data.streak.currentStreak === 1, 'Streak count remains strictly at 1');
    assert(resUpload2.data.streak.outfitHistory.length === 2, 'Both photos preserved in user gallery');

    const resUpload3 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);
    assert(resUpload3.data.qualifies === false, 'Third upload does NOT qualify');
    assert(resUpload3.data.streak.currentStreak === 1, 'Streak count still strictly 1');
    assert(resUpload3.data.streak.outfitHistory.length === 3, 'All 3 photos in user gallery');

    // -----------------------------------------------------------------------
    // TEST 3: Qualifying upload before deadline increases streak by exactly 1
    // -----------------------------------------------------------------------
    console.log('\n--- Test 3: Qualifying upload before deadline increases streak by exactly 1 ---');
    // Simulate 20 hours elapsed (entering the qualifying reminder window)
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-20h-elapsed'
    }, devHeaders);

    const resUpload4 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);
    assert(resUpload4.status === 200, 'Qualifying upload status is 200');
    assert(resUpload4.data.qualifies === true, 'Upload qualifies after 20h window opens');
    assert(resUpload4.data.streak.currentStreak === 2, 'Streak count increased by exactly 1 (1 -> 2)');
    assert(resUpload4.data.streak.outfitHistory.length === 4, 'Photo saved to gallery');

    // -----------------------------------------------------------------------
    // TEST 4: At 20 hours, timer reminder appears (approx 4 hours remaining)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 4: At 20 hours, timer reminder appears ---');
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-20h-elapsed'
    }, devHeaders);

    const resReminder = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    const msLeft = resReminder.data.streak.deadline - Date.now();
    const minsLeft = Math.round(msLeft / 60000);
    assert(minsLeft <= 245 && minsLeft >= 235, 'Remaining time is approx 4 hours (20 hours elapsed)');
    console.log(`Remaining time: ${minsLeft} minutes left (<= 240 mins) -> ⏳ reminder triggers`);

    // -----------------------------------------------------------------------
    // TEST 5: At 24 hours without a qualifying upload, streak breaks
    // -----------------------------------------------------------------------
    console.log('\n--- Test 5: At 24 hours without a qualifying upload, streak breaks ---');
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-deadline-expired'
    }, devHeaders);

    const resBreak = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    assert(resBreak.data.streak.streakStatus === 'broken', 'Streak status is broken');
    assert(resBreak.data.streak.currentStreak === 0, 'Current streak is reset to 0');
    assert(resBreak.data.streak.savedPreviousStreak === 2, 'Previous streak preserved at 2');

    // -----------------------------------------------------------------------
    // TEST 6: Fire animation changes to smoke & UI elements
    // -----------------------------------------------------------------------
    console.log('\n--- Test 6: Fire animation changes to smoke & UI elements ---');
    const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
    assert(indexHtml.includes('burning-wood-base') && indexHtml.includes('burning-wood-smoke-hero'), 'Burning wood and smoke elements present in HTML');
    assert(stylesCss.includes('gradualFlameExtinguish') && stylesCss.includes('smokeWaftRise'), 'Gradual flame-to-smoke CSS animations present');
    assert(indexHtml.includes('btnBreakStreakSubtle') && indexHtml.includes('confirmBreakStreakModal'), 'Voluntary break streak button and confirmation modal present in HTML');
    assert(indexHtml.includes('brokenStreakAlertBanner'), 'Red alert broken streak popup banner present in HTML');
    assert(stylesCss.includes('broken-streak-alert-banner') && stylesCss.includes('brokenWoodSmoke1'), 'Red alert popup styling and smoking wood icon animations present in CSS');

    // -----------------------------------------------------------------------
    // TEST 7: Restore continues from previous streak
    // -----------------------------------------------------------------------
    console.log('\n--- Test 7: Restore continues from previous streak ---');
    const resRestore = await request('POST', '/api/streak/restore', { userId: testUserId }, userHeaders);
    assert(resRestore.status === 200, 'Restore request status is 200');
    assert(resRestore.data.success === true, 'Restore success is true');
    assert(resRestore.data.streak.currentStreak === 2, 'Streak restored to previous count of 2');
    assert(resRestore.data.streak.streakStatus === 'restored', 'Status is restored');
    assert(resRestore.data.streak.deadline > Date.now(), 'Fresh 24h upload countdown started');

    const resContinue = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);
    assert(resContinue.data.qualifies === true, 'Upload within restored period qualifies');
    assert(resContinue.data.streak.currentStreak === 3, 'Streak successfully continues to 3');

    // -----------------------------------------------------------------------
    // TEST 8: Start Again resets streak to 0
    // -----------------------------------------------------------------------
    console.log('\n--- Test 8: Start Again resets streak to 0 ---');
    // Break streak
    await request('POST', '/api/streak/break', { userId: testUserId }, userHeaders);
    const resStartAgain = await request('POST', '/api/streak/start-again', { userId: testUserId }, userHeaders);
    assert(resStartAgain.status === 200, 'Start Again status is 200');
    assert(resStartAgain.data.streak.currentStreak === 0, 'Current streak reset to 0');
    assert(resStartAgain.data.streak.streakStatus === 'active', 'Status is active');

    // First upload after start again starts at 1
    const resFirstAfterReset = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    }, userHeaders);
    assert(resFirstAfterReset.data.streak.currentStreak === 1, 'First upload after Start Again starts streak at 1');

    // -----------------------------------------------------------------------
    // TEST 9: Restoration cannot be used twice within 30 days
    // -----------------------------------------------------------------------
    console.log('\n--- Test 9: Restoration cannot be used twice within 30 days ---');
    // Break streak
    await request('POST', '/api/streak/break', { userId: testUserId }, userHeaders);

    const resBlockedRestore = await request('POST', '/api/streak/restore', { userId: testUserId }, userHeaders);
    assert(resBlockedRestore.status === 403, 'Second restore is blocked with HTTP 403');
    assert(resBlockedRestore.data.success === false, 'Success is false');
    assert(resBlockedRestore.data.error.includes('30 days'), 'Error clearly indicates 30-day limit');
    assert(typeof resBlockedRestore.data.nextEligibilityTimestamp === 'number', 'Clear next eligibility timestamp provided');

    // -----------------------------------------------------------------------
    // TEST 10: Restoration becomes available again after 30 days
    // -----------------------------------------------------------------------
    console.log('\n--- Test 10: Restoration becomes available again after 30 days ---');
    // Fast forward 31 days on restoration timestamp
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-restore-cooldown',
      daysAgo: 31
    }, devHeaders);

    const resAllowedRestore = await request('POST', '/api/streak/restore', { userId: testUserId }, userHeaders);
    assert(resAllowedRestore.status === 200, 'Restore is permitted after 30 days have elapsed');
    assert(resAllowedRestore.data.success === true, 'Restore successful');
    assert(resAllowedRestore.data.streak.streakStatus === 'restored', 'Status is restored');

    // -----------------------------------------------------------------------
    // TEST 11: Photos remain in gallery after streak breaks and resets
    // -----------------------------------------------------------------------
    console.log('\n--- Test 11: Photos remain in gallery after streak breaks and resets ---');
    const resGallery = await request('GET', `/api/streak/gallery?userId=${testUserId}`, null, userHeaders);
    assert(resGallery.status === 200, 'Gallery request status 200');
    assert(Array.isArray(resGallery.data.gallery), 'Gallery is an array');
    assert(resGallery.data.gallery.length >= 6, `All photos preserved throughout breaks & resets (count: ${resGallery.data.gallery.length})`);
    assert(resGallery.data.gallery[0].photoUrl.startsWith('/uploads/streaks/'), 'Photos have valid persistent server URLs');

    // -----------------------------------------------------------------------
    // TEST 12: Refreshing does not reset timer or bypass restrictions
    // -----------------------------------------------------------------------
    console.log('\n--- Test 12: Refreshing does not reset timer or bypass restrictions ---');
    const refresh1 = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    const refresh2 = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    assert(refresh1.data.streak.deadline === refresh2.data.streak.deadline, 'Deadline preserved across refreshes');
    assert(refresh1.data.streak.lastRestorationTimestamp === refresh2.data.streak.lastRestorationTimestamp, 'Restoration timestamps preserved across refreshes');
    assert(refresh1.data.streak.currentStreak === refresh2.data.streak.currentStreak, 'Streak count preserved across refreshes');

    // -----------------------------------------------------------------------
    // TEST 13: Multiple devices show the same streak information
    // -----------------------------------------------------------------------
    console.log('\n--- Test 13: Multiple devices show the same streak information ---');
    const device1 = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    const device2 = await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders);
    assert(device1.data.streak.currentStreak === device2.data.streak.currentStreak, 'Device 1 & 2 have identical streak count');
    assert(device1.data.streak.deadline === device2.data.streak.deadline, 'Device 1 & 2 have identical deadline');
    assert(device1.data.streak.outfitHistory.length === device2.data.streak.outfitHistory.length, 'Device 1 & 2 have identical gallery');

    // -----------------------------------------------------------------------
    // TEST 14: Failed uploads never award streak credit
    // -----------------------------------------------------------------------
    console.log('\n--- Test 14: Failed uploads never award streak credit ---');
    const streakBeforeFailed = (await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders)).data.streak.currentStreak;

    // Send invalid payload (missing photo data)
    const resFail1 = await request('POST', '/api/streak/upload', { userId: testUserId }, userHeaders);
    assert(resFail1.status === 400, 'Invalid upload rejected with 400');

    // Send malformed non-base64 string
    const resFail2 = await request('POST', '/api/streak/upload', { userId: testUserId, photoData: 'data:image/jpeg;base64,!!!invalid!!!' }, userHeaders);
    const streakAfterFailed = (await request('GET', `/api/streak?userId=${testUserId}`, null, userHeaders)).data.streak.currentStreak;
    assert(streakBeforeFailed === streakAfterFailed, `Streak count unaffected by failed uploads (${streakBeforeFailed} === ${streakAfterFailed})`);

    // -----------------------------------------------------------------------
    // TEST 15: Security - Users cannot access another user's streak data (Issue 4)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 15: Security - Users cannot access another user data ---');
    const otherUser = 'unauthorized_victim_user_' + Date.now();
    // User A trying to query User B data
    const resForbidden = await request('GET', `/api/streak?userId=${otherUser}`, null, userHeaders);
    assert(resForbidden.status === 403, 'Access to another user streak data blocked with 403 Forbidden');
    assert(resForbidden.data.error.includes('not authorized'), 'Error message clearly indicates authorization violation');

    // Invalid token rejected
    const resInvalidToken = await request('GET', `/api/streak?userId=${testUserId}`, null, { 'Authorization': 'Bearer invalid.token.value' });
    assert(resInvalidToken.status === 401, 'Request with invalid token rejected with 401 Unauthorized');

    // -----------------------------------------------------------------------
    // TEST 16: Security - Developer simulation is restricted (Issue 5)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 16: Security - Developer simulation is restricted ---');
    // Normal user token calling dev-simulate
    const resDevForbidden = await request('POST', '/api/streak/dev-simulate', { userId: testUserId, action: 'set-20h-elapsed' }, userHeaders);
    assert(resDevForbidden.status === 403, 'Developer simulation rejected for normal user with 403 Forbidden');

    // -----------------------------------------------------------------------
    // TEST 17: New User starts at zero streak and no previous streak 1 (Issue 3)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 17: New user starts at zero streak and no previous streak 1 ---');
    const brandNewUserId = 'newbie_user_' + Date.now();
    const newBrandToken = serverInstance.generateAuthToken({ userId: brandNewUserId, role: 'user' });
    const newBrandHeaders = { 'Authorization': `Bearer ${newBrandToken}` };

    const resNewUser = await request('GET', `/api/streak?userId=${brandNewUserId}`, null, newBrandHeaders);
    assert(resNewUser.data.streak.currentStreak === 0, 'New user streak starts at 0');
    assert(resNewUser.data.streak.savedPreviousStreak === 0, 'New user saved previous streak is 0');

    // Breaking zero streak does not assign 1
    const resBreakZero = await request('POST', '/api/streak/break', { userId: brandNewUserId }, newBrandHeaders);
    assert(resBreakZero.data.streak.currentStreak === 0, 'Current streak remains 0');
    assert(resBreakZero.data.streak.savedPreviousStreak === 0, 'Saved previous streak remains 0 (does NOT assign 1)');

    // -----------------------------------------------------------------------
    // TEST 18: Photo Storage Reliability (Issue 7)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 18: Photo storage reliability ---');
    const galleryItem = resGallery.data.gallery[0];
    const photoFetch = await request('GET', galleryItem.photoUrl);
    assert(photoFetch.status === 200, 'Uploaded photo accessible via GET request');
    assert(photoFetch.headers['content-type'].startsWith('image/'), 'Content-Type header correctly served');

    console.log('\n======================================================');
    console.log('  🎉 ALL 18 TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  }
}

setTimeout(runAllTests, 500);
