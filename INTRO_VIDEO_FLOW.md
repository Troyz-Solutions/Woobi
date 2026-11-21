# Woobi App Launch Flow

## App Launch Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAUNCHES APP                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        IntroActivity                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              ┌─────────────────────┐                     │  │
│  │              │                     │                     │  │
│  │              │   Woobi Intro Video │                     │  │
│  │              │    (Full Screen)    │                     │  │
│  │              │       Muted         │                     │  │
│  │              │      Portrait       │                     │  │
│  │              │                     │                     │  │
│  │              └─────────────────────┘                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Duration: ~5-10 seconds                                        │
│  User can skip with back button                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Video completes OR
                                │ Error occurs OR
                                │ User presses back
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MainActivity                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                    WebView Interface                      │  │
│  │                                                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │   Studio   │  │  Wardrobe  │  │  Settings  │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  │                                                           │  │
│  │              (Normal app functionality)                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Video does NOT replay when navigating between screens          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ User navigates,
                                │ uses features,
                                │ then closes app
                                │
                                ▼
                         [App Closed]
                                │
                                │ User relaunches
                                │
                                ▼
                      [Video plays again]
```

## State Diagram

```
                    ┌────────────────┐
                    │  App Launched  │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ IntroActivity  │
                    │  Loads Video   │
                    └────────┬───────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Video   │  │   User   │  │  Video   │
        │Completes │  │  Presses │  │  Error   │
        │ Playing  │  │   Back   │  │ Occurs   │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             └──────────┬──┴─────────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   MainActivity    │
              │  FLAG_CLEAR_TASK  │
              │ (IntroActivity is │
              │   destroyed)      │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ User interacts    │
              │ with app          │
              │ (Video won't      │
              │  replay)          │
              └─────────┬─────────┘
                        │
                        ▼
                    [Normal app flow]
```

## Activity Lifecycle

### First Launch
```
IntroActivity.onCreate()
    ├─ Load layout
    ├─ Setup VideoView
    ├─ Set video URI (R.raw.woobi_intro)
    ├─ Configure muted playback
    └─ Start video

IntroActivity.onVideoComplete() OR onError()
    ├─ Create Intent to MainActivity
    ├─ Set FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK
    ├─ Start MainActivity
    └─ finish() [IntroActivity destroyed]

MainActivity.onCreate()
    ├─ Setup WebView
    ├─ Load index.html
    └─ Normal app functionality begins
```

### Subsequent Navigation
```
MainActivity (running)
    ├─ User navigates to different screens
    ├─ WebView loads different pages
    └─ IntroActivity is NOT in back stack
        (Video does not replay)
```

### App Relaunch
```
[User closes app completely]
    └─ All activities destroyed

[User launches app again]
    └─ IntroActivity.onCreate() again
        └─ Video plays again
```

## Error Handling Flow

```
┌─────────────────────────────┐
│  IntroActivity.onCreate()   │
└──────────────┬──────────────┘
               │
               ▼
       ┌───────────────┐
       │ Try to load   │
       │ video file    │
       └───┬───────┬───┘
           │       │
    Success│       │Error
           │       │
           ▼       ▼
    ┌──────────┐  ┌──────────────────┐
    │  Video   │  │ onError() called │
    │  Plays   │  │ or Exception     │
    └────┬─────┘  │ caught           │
         │        └────┬─────────────┘
         │             │
  Completes            │
         │             │
         └──────┬──────┘
                │
                ▼
      ┌──────────────────┐
      │ navigateToMain() │
      │ (safe navigation)│
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │  MainActivity    │
      │  loaded safely   │
      └──────────────────┘
```

## Implementation Details

### IntroActivity Configuration
- **Launch Mode**: MAIN/LAUNCHER (first activity)
- **Orientation**: Portrait (locked)
- **Theme**: NoTitleBar.Fullscreen (immersive)
- **Exported**: true (can be launched by system)

### MainActivity Configuration
- **Launch Mode**: Standard (launched by IntroActivity)
- **Orientation**: Sensor-based
- **Theme**: Theme.AuraWardrobe
- **Exported**: false (only launched internally)

### Video Properties
- **Location**: res/raw/woobi_intro.mp4
- **Size**: 323.52 KB
- **Format**: MP4
- **Playback**: Muted, no loop
- **Scaling**: Aspect-ratio preserved

## Navigation Flags

```kotlin
Intent(this, MainActivity::class.java).apply {
    flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
            Intent.FLAG_ACTIVITY_CLEAR_TASK
}
```

**Effect**: 
- Clears entire activity stack
- Makes MainActivity the new root
- IntroActivity is destroyed
- User can't navigate back to intro
- Back button on MainActivity exits app

## Key Features

✅ **One-time playback per launch**  
✅ **Automatic progression**  
✅ **User can skip**  
✅ **Error-resilient**  
✅ **No replay on navigation**  
✅ **Clean memory management**  
✅ **Portrait-optimized**  
✅ **Full-screen immersive**  

## Testing Scenarios

1. **Happy Path**: Launch → Video plays → Auto-navigate → Use app
2. **Skip**: Launch → Back button → Navigate to main
3. **Error**: Launch → Video fails → Auto-navigate to main
4. **Relaunch**: Use app → Close → Reopen → Video plays again
5. **Navigation**: Use app features → No video replay
6. **Rotation**: Portrait locked during video → Normal after

## Summary

The intro video integration is:
- **Non-intrusive**: Only shows on app launch
- **Skippable**: Users have control
- **Reliable**: Falls back gracefully on errors
- **Efficient**: Small file size, native player
- **Professional**: Full-screen immersive experience
