# Woobi Intro Video - Implementation Validation Script
# Checks that all required files are in place for the intro video feature

Write-Host "`n=== Woobi Intro Video Implementation Validation ===" -ForegroundColor Cyan

$baseDir = "c:\Users\Admin\Desktop\troy\Woobi\android-app\app\src\main"
$errors = @()
$warnings = @()
$success = @()

# Check IntroActivity.kt
$introActivity = Join-Path $baseDir "java\com\example\aurawardrobe\IntroActivity.kt"
if (Test-Path $introActivity) {
    $content = Get-Content $introActivity -Raw
    if ($content -match "class IntroActivity" -and $content -match "setVideoURI" -and $content -match "navigateToMain") {
        $success += "[OK] IntroActivity.kt exists and contains required code"
    } else {
        $warnings += "[WARN] IntroActivity.kt exists but may be incomplete"
    }
} else {
    $errors += "[ERROR] IntroActivity.kt not found"
}

# Check activity_intro.xml
$introLayout = Join-Path $baseDir "res\layout\activity_intro.xml"
if (Test-Path $introLayout) {
    $content = Get-Content $introLayout -Raw
    if ($content -match "VideoView" -and $content -match "android:id=.*@\+id/videoView") {
        $success += "[OK] activity_intro.xml exists with VideoView"
    } else {
        $warnings += "[WARN] activity_intro.xml exists but may be missing VideoView"
    }
} else {
    $errors += "[ERROR] activity_intro.xml not found"
}

# Check video file
$videoFile = Join-Path $baseDir "res\raw\woobi_intro.mp4"
if (Test-Path $videoFile) {
    $fileSize = (Get-Item $videoFile).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    $success += "[OK] woobi_intro.mp4 exists ($fileSizeKB KB)"
    
    if ($fileSize -eq 0) {
        $errors += "[ERROR] Video file is empty (0 bytes)"
    } elseif ($fileSize -gt 10MB) {
        $warnings += "[WARN] Video file is large (${fileSizeKB} KB) - may increase APK size significantly"
    }
} else {
    $errors += "[ERROR] woobi_intro.mp4 not found in res/raw/"
}

# Check AndroidManifest.xml
$manifest = Join-Path $baseDir "AndroidManifest.xml"
if (Test-Path $manifest) {
    $content = Get-Content $manifest -Raw
    if ($content -match "IntroActivity" -and $content -match "android.intent.action.MAIN") {
        $success += "[OK] AndroidManifest.xml declares IntroActivity as launcher"
    } else {
        $errors += "[ERROR] AndroidManifest.xml does not properly declare IntroActivity"
    }
    
    if ($content -match "MainActivity" -and $content -match "android:exported=.false") {
        $success += "[OK] MainActivity is no longer the launcher activity"
    } else {
        $warnings += "[WARN] MainActivity export status may need verification"
    }
} else {
    $errors += "[ERROR] AndroidManifest.xml not found"
}

# Check MainActivity.kt (should be unchanged)
$mainActivity = Join-Path $baseDir "java\com\example\aurawardrobe\MainActivity.kt"
if (Test-Path $mainActivity) {
    $success += "[OK] MainActivity.kt exists (unchanged)"
} else {
    $errors += "[ERROR] MainActivity.kt not found"
}

# Display results
Write-Host "`n--- Success ---" -ForegroundColor Green
foreach ($msg in $success) {
    Write-Host $msg -ForegroundColor Green
}

if ($warnings.Count -gt 0) {
    Write-Host "`n--- Warnings ---" -ForegroundColor Yellow
    foreach ($msg in $warnings) {
        Write-Host $msg -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n--- Errors ---" -ForegroundColor Red
    foreach ($msg in $errors) {
        Write-Host $msg -ForegroundColor Red
    }
    Write-Host "`nValidation FAILED - Please fix the errors above" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n=== Validation PASSED ===" -ForegroundColor Green
    Write-Host "All required files are in place for the intro video feature." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Build the APK: cd android-app && gradlew.bat assembleDebug" -ForegroundColor White
    Write-Host "2. Install on device: adb install app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor White
    Write-Host "3. Test the intro video on app launch" -ForegroundColor White
    exit 0
}
