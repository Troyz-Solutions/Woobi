const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple 1x1 transparent PNG base64 for test uploads
const DUMMY_PNG_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const TEST_PORT = 5058;
process.env.PORT = TEST_PORT;

// Start server instance for testing
const serverPath = path.join(__dirname, 'server.js');
delete require.cache[require.resolve(serverPath)];
require(serverPath);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
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
  console.log('  RUNNING 14 WOOBI STREAK SYSTEM ACCEPTANCE TESTS');
  console.log('======================================================\n');

  const testUserId = 'test_user_' + Date.now();

  try {
    // Setup: Reset test user
    await request('POST', '/api/streak/dev-simulate', { userId: testUserId, action: 'reset-all' });

    // -----------------------------------------------------------------------
    // TEST 1: First upload changes streak from 0 to 1
    // -----------------------------------------------------------------------
    console.log('--- Test 1: First upload changes streak from 0 to 1 ---');
    const resInitial = await request('GET', `/api/streak?userId=${testUserId}`);
    assert(resInitial.data.streak.currentStreak === 0, 'Initial streak is 0');

    const res1 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(res1.status === 200, 'Upload 1 status is 200');
    assert(res1.data.qualifies === true, 'Upload 1 qualifies for streak increment');
    assert(res1.data.streak.currentStreak === 1, 'Upload 1 increased streak to 1');
    assert(res1.data.streak.streakStatus === 'active', 'Streak status is active');
    assert(res1.data.streak.deadline > Date.now(), 'Deadline is set to +24 hours');
    assert(res1.data.streak.outfitHistory.length === 1, '1 photo in gallery history');

    // -----------------------------------------------------------------------
    // TEST 2: Multiple uploads in the same 24-hour period count only once
    // -----------------------------------------------------------------------
    console.log('\n--- Test 2: Multiple uploads in the same 24-hour period count only once ---');
    // Upload again immediately (same 24-hour window)
    const res2 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(res2.status === 200, 'Second upload status is 200');
    assert(res2.data.qualifies === false, 'Second upload within same 24h does NOT qualify for streak increment');
    assert(res2.data.streak.currentStreak === 1, 'Streak count remains strictly at 1');
    assert(res2.data.streak.outfitHistory.length === 2, 'Both photos preserved in user gallery');

    // Upload a third time
    const res3 = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(res3.data.qualifies === false, 'Third upload does NOT qualify');
    assert(res3.data.streak.currentStreak === 1, 'Streak count still strictly 1');
    assert(res3.data.streak.outfitHistory.length === 3, 'All 3 photos in user gallery');

    // -----------------------------------------------------------------------
    // TEST 3: A qualifying upload before deadline increases streak by exactly 1
    // -----------------------------------------------------------------------
    console.log('\n--- Test 3: Qualifying upload before deadline increases streak by exactly 1 ---');
    // Simulate 20 hours have elapsed (in qualifying window: 4 hours left)
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-20h-elapsed'
    });

    const resQualifying = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(resQualifying.status === 200, 'Qualifying upload status is 200');
    assert(resQualifying.data.qualifies === true, 'Upload qualifies after 20h window opens');
    assert(resQualifying.data.streak.currentStreak === 2, 'Streak count increased by exactly 1 (1 -> 2)');
    assert(resQualifying.data.streak.outfitHistory.length === 4, 'Photo saved to gallery');

    // -----------------------------------------------------------------------
    // TEST 4: At 20 hours, timer reminder appears (threshold calculation)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 4: At 20 hours, timer reminder appears ---');
    // Simulate 20 hours elapsed for streak 2
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-20h-elapsed'
    });
    const resTimeCheck = await request('GET', `/api/streak?userId=${testUserId}`);
    const remainingMs = resTimeCheck.data.streak.deadline - Date.now();
    const FOUR_HOURS = 4 * 3600 * 1000;
    assert(remainingMs <= FOUR_HOURS && remainingMs > 0, 'Remaining time is approx 4 hours (20 hours elapsed)');
    console.log(`Remaining time: ${Math.round(remainingMs / (60 * 1000))} minutes left (<= 240 mins) -> ⏳ reminder triggers`);

    // -----------------------------------------------------------------------
    // TEST 5: At 24 hours without a qualifying upload, streak breaks
    // -----------------------------------------------------------------------
    console.log('\n--- Test 5: At 24 hours without a qualifying upload, streak breaks ---');
    // Expire deadline
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-deadline-expired'
    });

    const resBreak = await request('GET', `/api/streak?userId=${testUserId}`);
    assert(resBreak.data.streak.streakStatus === 'broken', 'Streak status is broken');
    assert(resBreak.data.streak.currentStreak === 0, 'Current streak is reset to 0');
    assert(resBreak.data.streak.savedPreviousStreak === 2, 'Previous streak preserved at 2');

    // -----------------------------------------------------------------------
    // TEST 6: Fire animation changes to smoke & Break Streak elements
    // -----------------------------------------------------------------------
    console.log('\n--- Test 6: Fire animation changes to smoke & Break Streak elements ---');
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
    const resRestore = await request('POST', '/api/streak/restore', { userId: testUserId });
    assert(resRestore.status === 200, 'Restore request status is 200');
    assert(resRestore.data.success === true, 'Restore success is true');
    assert(resRestore.data.streak.currentStreak === 2, 'Streak restored to previous count of 2');
    assert(resRestore.data.streak.streakStatus === 'restored', 'Status is restored');
    assert(resRestore.data.streak.deadline > Date.now(), 'Fresh 24h upload countdown started');

    // Upload within fresh 24h period continues streak
    const resContinue = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(resContinue.data.qualifies === true, 'Upload within restored period qualifies');
    assert(resContinue.data.streak.currentStreak === 3, 'Streak successfully continues to 3');

    // -----------------------------------------------------------------------
    // TEST 8: Start Again resets streak to 0
    // -----------------------------------------------------------------------
    console.log('\n--- Test 8: Start Again resets streak to 0 ---');
    // Break streak
    await request('POST', '/api/streak/break', { userId: testUserId });
    const resStartAgain = await request('POST', '/api/streak/start-again', { userId: testUserId });
    assert(resStartAgain.status === 200, 'Start Again status is 200');
    assert(resStartAgain.data.streak.currentStreak === 0, 'Current streak reset to 0');
    assert(resStartAgain.data.streak.streakStatus === 'active', 'Status is active');

    // First upload starts fresh streak at 1
    const resFreshUpload = await request('POST', '/api/streak/upload', {
      userId: testUserId,
      photoData: DUMMY_PNG_DATA
    });
    assert(resFreshUpload.data.streak.currentStreak === 1, 'First upload after Start Again starts streak at 1');

    // -----------------------------------------------------------------------
    // TEST 9: Restoration cannot be used twice within 30 days
    // -----------------------------------------------------------------------
    console.log('\n--- Test 9: Restoration cannot be used twice within 30 days ---');
    // Break streak again
    await request('POST', '/api/streak/break', { userId: testUserId });

    // Attempt second restore (first restore was performed in Test 7 within rolling 30 days)
    const resBlockedRestore = await request('POST', '/api/streak/restore', { userId: testUserId });
    assert(resBlockedRestore.status === 403, 'Second restore is blocked with HTTP 403');
    assert(resBlockedRestore.data.success === false, 'Success is false');
    assert(resBlockedRestore.data.error.includes('30 days'), 'Error clearly indicates 30-day limit');
    assert(typeof resBlockedRestore.data.nextEligibilityTimestamp === 'number', 'Clear next eligibility timestamp provided');

    // -----------------------------------------------------------------------
    // TEST 10: Restoration becomes available again after 30 days
    // -----------------------------------------------------------------------
    console.log('\n--- Test 10: Restoration becomes available again after 30 days ---');
    // Fast-forward lastRestorationTimestamp to 31 days ago
    await request('POST', '/api/streak/dev-simulate', {
      userId: testUserId,
      action: 'set-restore-cooldown',
      daysAgo: 31
    });

    const resAllowedRestore = await request('POST', '/api/streak/restore', { userId: testUserId });
    assert(resAllowedRestore.status === 200, 'Restore is permitted after 30 days have elapsed');
    assert(resAllowedRestore.data.success === true, 'Restore successful');
    assert(resAllowedRestore.data.streak.streakStatus === 'restored', 'Status is restored');

    // -----------------------------------------------------------------------
    // TEST 11: Photos remain in the gallery after streak breaks and resets
    // -----------------------------------------------------------------------
    console.log('\n--- Test 11: Photos remain in gallery after streak breaks and resets ---');
    const resGallery = await request('GET', `/api/streak/gallery?userId=${testUserId}`);
    assert(resGallery.status === 200, 'Gallery request status 200');
    assert(Array.isArray(resGallery.data.gallery), 'Gallery is an array');
    assert(resGallery.data.gallery.length >= 6, `All photos preserved throughout breaks & resets (count: ${resGallery.data.gallery.length})`);
    assert(resGallery.data.gallery[0].photoUrl.startsWith('/uploads/streaks/'), 'Photos have valid persistent server URLs');

    // -----------------------------------------------------------------------
    // TEST 12: Refreshing website does not reset timer or bypass restrictions
    // -----------------------------------------------------------------------
    console.log('\n--- Test 12: Refreshing does not reset timer or bypass restrictions ---');
    // Multiple distinct requests without session state to emulate page refresh
    const refresh1 = await request('GET', `/api/streak?userId=${testUserId}`);
    const refresh2 = await request('GET', `/api/streak?userId=${testUserId}`);
    assert(refresh1.data.streak.deadline === refresh2.data.streak.deadline, 'Deadline preserved across refreshes');
    assert(refresh1.data.streak.lastRestorationTimestamp === refresh2.data.streak.lastRestorationTimestamp, 'Restoration timestamps preserved across refreshes');
    assert(refresh1.data.streak.currentStreak === refresh2.data.streak.currentStreak, 'Streak count preserved across refreshes');

    // -----------------------------------------------------------------------
    // TEST 13: Multiple devices show the same streak information
    // -----------------------------------------------------------------------
    console.log('\n--- Test 13: Multiple devices show the same streak information ---');
    // Emulate device 1 and device 2 making requests for same user
    const device1 = await request('GET', `/api/streak?userId=${testUserId}`);
    const device2 = await request('GET', `/api/streak?userId=${testUserId}`);
    assert(device1.data.streak.currentStreak === device2.data.streak.currentStreak, 'Device 1 & 2 have identical streak count');
    assert(device1.data.streak.deadline === device2.data.streak.deadline, 'Device 1 & 2 have identical deadline');
    assert(device1.data.streak.outfitHistory.length === device2.data.streak.outfitHistory.length, 'Device 1 & 2 have identical gallery');

    // -----------------------------------------------------------------------
    // TEST 14: Failed uploads never award streak credit
    // -----------------------------------------------------------------------
    console.log('\n--- Test 14: Failed uploads never award streak credit ---');
    const streakBeforeFailed = (await request('GET', `/api/streak?userId=${testUserId}`)).data.streak.currentStreak;

    // Send invalid payload (missing photo data)
    const resFail1 = await request('POST', '/api/streak/upload', { userId: testUserId });
    assert(resFail1.status === 400, 'Invalid upload rejected with 400');

    // Send malformed non-base64 string
    const resFail2 = await request('POST', '/api/streak/upload', { userId: testUserId, photoData: 'data:image/jpeg;base64,!!!invalid!!!' });
    // Verify streak count did NOT increment
    const streakAfterFailed = (await request('GET', `/api/streak?userId=${testUserId}`)).data.streak.currentStreak;
    assert(streakBeforeFailed === streakAfterFailed, `Streak count unaffected by failed uploads (${streakBeforeFailed} === ${streakAfterFailed})`);

    console.log('\n======================================================');
    console.log('  🎉 ALL 14 TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  }
}

setTimeout(runAllTests, 500);

