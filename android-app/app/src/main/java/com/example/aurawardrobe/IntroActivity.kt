package com.example.aurawardrobe

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.WindowManager
import android.widget.VideoView
import androidx.activity.ComponentActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * IntroActivity - Plays the Woobi intro video on app launch
 * 
 * Features:
 * - Full-screen portrait video playback
 * - Auto-plays video on launch
 * - Proper aspect ratio scaling without unnecessary stretching/cropping
 * - Navigates to MainActivity after completion or on error
 * - Only plays once per app launch session
 * - Fallback safety timer to ensure smooth transition
 */
class IntroActivity : ComponentActivity() {

    private var videoView: VideoView? = null
    private var hasNavigated = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private val safetyTimeoutRunnable = Runnable {
        Log.w(TAG, "Safety timeout reached (5s), navigating to MainActivity")
        navigateToMain()
    }

    companion object {
        private const val TAG = "WoobiIntro"
        private const val MAX_INTRO_DURATION_MS = 5000L // 5 seconds max fallback
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable immersive full-screen mode
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
        
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        
        // Set black background for letterboxing/pillarboxing if needed
        window.decorView.setBackgroundColor(Color.BLACK)
        
        setContentView(R.layout.activity_intro)
        
        // Schedule safety timeout to guarantee progression even if playback hangs
        mainHandler.postDelayed(safetyTimeoutRunnable, MAX_INTRO_DURATION_MS)

        videoView = findViewById(R.id.videoView)
        setupVideoPlayback()
    }

    private fun setupVideoPlayback() {
        val videoView = this.videoView ?: run {
            Log.e(TAG, "VideoView not found, navigating to MainActivity")
            navigateToMain()
            return
        }

        try {
            // Set video URI from raw resources
            val videoUri = Uri.parse("android.resource://$packageName/${R.raw.woobi_intro}")
            videoView.setVideoURI(videoUri)

            // Configure video for proper scaling
            videoView.setOnPreparedListener { mediaPlayer ->
                try {
                    // Get video dimensions for optimal scaling
                    val videoWidth = mediaPlayer.videoWidth
                    val videoHeight = mediaPlayer.videoHeight
                    val screenWidth = resources.displayMetrics.widthPixels
                    val screenHeight = resources.displayMetrics.heightPixels

                    Log.d(TAG, "Video prepared: ${videoWidth}x${videoHeight}, Screen: ${screenWidth}x${screenHeight}")

                    // Calculate scaling to fit screen while maintaining aspect ratio
                    val videoAspectRatio = videoWidth.toFloat() / videoHeight.toFloat()
                    val screenAspectRatio = screenWidth.toFloat() / screenHeight.toFloat()

                    val layoutParams = videoView.layoutParams
                    if (videoAspectRatio > screenAspectRatio) {
                        // Video is wider - fit to width
                        layoutParams.width = screenWidth
                        layoutParams.height = (screenWidth / videoAspectRatio).toInt()
                    } else {
                        // Video is taller - fit to height
                        layoutParams.height = screenHeight
                        layoutParams.width = (screenHeight * videoAspectRatio).toInt()
                    }
                    videoView.layoutParams = layoutParams

                    // Start playback
                    mediaPlayer.isLooping = false
                    videoView.start()
                    
                    Log.d(TAG, "Video playback started")
                } catch (e: Exception) {
                    Log.e(TAG, "Error in onPrepared", e)
                    navigateToMain()
                }
            }

            // Handle completion
            videoView.setOnCompletionListener {
                Log.d(TAG, "Video playback completed")
                navigateToMain()
            }

            // Handle errors
            videoView.setOnErrorListener { _, what, extra ->
                Log.e(TAG, "Video playback error: what=$what, extra=$extra")
                navigateToMain()
                true // Return true to indicate we handled the error
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error setting up video playback", e)
            navigateToMain()
        }
    }

    private fun navigateToMain() {
        if (hasNavigated) {
            return // Prevent multiple navigation calls
        }
        hasNavigated = true
        mainHandler.removeCallbacks(safetyTimeoutRunnable)

        try {
            val intent = Intent(this, MainActivity::class.java)
            // Clear this activity from the back stack
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            Log.e(TAG, "Error navigating to MainActivity", e)
            finish()
        }
    }

    override fun onPause() {
        super.onPause()
        // Stop video when activity is paused (e.g., user navigates away)
        videoView?.pause()
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(safetyTimeoutRunnable)
        videoView?.stopPlayback()
        videoView = null
        super.onDestroy()
    }

    override fun onBackPressed() {
        // Allow back press to skip intro and go to main screen
        super.onBackPressed()
        navigateToMain()
    }
}
