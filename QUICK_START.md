# Woobi Intro Video - Quick Start Guide

## ✅ Implementation Complete

Your intro video has been integrated into the Woobi mobile app.

## Build Commands

### Quick Build (Recommended)
```bash
cd c:\Users\Admin\Desktop\troy\Woobi
npm run build:apk
```

### Manual Build
```bash
cd android-app
gradlew.bat assembleDebug
```

### Output Location
```
android-app/app/build/outputs/apk/debug/app-debug.apk
```

## Install on Device

### USB Connection
```bash
adb install android-app/app/build/outputs/apk/debug/app-debug.apk
```

### Wireless (if enabled)
```bash
adb connect <device-ip>:5555
adb install android-app/app/build/outputs/apk/debug/app-debug.apk
```

## Expected Behavior

1. **Launch app** → Video plays full-screen
2. **Wait ~5-10 seconds** → Video completes
3. **Auto-navigate** → Home screen appears
4. **Navigate around** → Video doesn't replay
5. **Close & reopen app** → Video plays again

## User Controls

- **Back button during video** → Skips to home screen
- **Video error** → Automatically goes to home screen
- **Subsequent navigation** → No video replay

## Verification Checklist

- [ ] Video plays on app launch
- [ ] Video is muted (no sound)
- [ ] Video is full-screen portrait
- [ ] No stretching or distortion
- [ ] Auto-navigates to home after completion
- [ ] Can skip with back button
- [ ] Doesn't replay when navigating between screens

## File Locations

**IntroActivity**: `android-app/app/src/main/java/com/example/aurawardrobe/IntroActivity.kt`  
**Video File**: `android-app/app/src/main/res/raw/woobi_intro.mp4`  
**Layout**: `android-app/app/src/main/res/layout/activity_intro.xml`  
**Manifest**: `android-app/app/src/main/AndroidManifest.xml`  

## Troubleshooting

### Build fails with "JAVA_HOME not set"
Install JDK 21 and set JAVA_HOME environment variable

### Video doesn't play
Check logcat: `adb logcat -s WoobiIntro`

### App crashes
Check full logs: `adb logcat -s AndroidRuntime`

## Need More Info?

- **INTRO_VIDEO_SUMMARY.md** - Complete overview
- **INTRO_VIDEO_IMPLEMENTATION.md** - Technical details
- **validate-intro-implementation.ps1** - Validation script

## Ready to Test!

Run validation first:
```bash
.\validate-intro-implementation.ps1
```

Then build and install:
```bash
npm run build:apk
adb install android-app/app/build/outputs/apk/debug/app-debug.apk
```

🚀 **You're all set!**
