package com.example.aurawardrobe

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import android.view.View
import android.view.WindowManager
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
            filePathCallback?.onReceiveValue(results)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[android.Manifest.permission.CAMERA] ?: false
        Log.d(TAG, "Camera permission callback: granted = $cameraGranted")
    }

    companion object {
        private const val TAG = "WoobiWebView"
        private const val LIGHT_BG = "#FAF9F6"
        private const val DARK_BG = "#161815"
    }

    class AndroidThemeBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun onThemeChanged(theme: String) {
            activity.runOnUiThread {
                activity.applyTheme(theme)
            }
        }
    }

    fun applyTheme(theme: String) {
        val isDark = if (theme == "system") {
            (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        } else {
            theme == "dark"
        }

        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = !isDark
        insetsController.isAppearanceLightNavigationBars = !isDark

        val bgColor = Color.parseColor(if (isDark) DARK_BG else LIGHT_BG)
        window.decorView.setBackgroundColor(bgColor)
        webView?.setBackgroundColor(bgColor)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val isSystemDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = !isSystemDark
            isAppearanceLightNavigationBars = !isSystemDark
        }
        val initBg = Color.parseColor(if (isSystemDark) DARK_BG else LIGHT_BG)
        window.decorView.setBackgroundColor(initBg)

        // Request runtime Camera permission if needed for taking photos
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            cameraPermissionLauncher.launch(arrayOf(android.Manifest.permission.CAMERA))
        }

        // Enable Chrome remote debugging: open chrome://inspect in desktop Chrome
        WebView.setWebContentsDebuggingEnabled(true)
        // Hardware acceleration enabled for silky-smooth WebView rendering
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        var lastTopDp = 0f
        var lastBottomDp = 0f
        fun pushAndroidInsets(wv: WebView?, topDp: Float, bottomDp: Float) {
            wv?.post {
                val js = """
                    (function(){
                      var r = document.documentElement;
                      if (!r) return;
                      r.style.setProperty('--android-inset-top', '${topDp}px');
                      r.style.setProperty('--android-inset-bottom', '${bottomDp}px');
                    })();
                """.trimIndent()
                wv.evaluateJavascript(js, null)
            }
        }

        val view = WebView(this).apply {
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(initBg)
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
            }

            addJavascriptInterface(AndroidThemeBridge(this@MainActivity), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    if (request != null) {
                        val response = assetLoader.shouldInterceptRequest(request.url)
                        if (response != null) return response
                    }
                    return super.shouldInterceptRequest(view, request)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    pushAndroidInsets(view, lastTopDp, lastBottomDp)
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e(TAG, "Resource loading error: ${request?.url} - ${error?.description}")
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        Log.d(TAG, "[${it.messageLevel()}] ${it.message()} (${it.sourceId()}:${it.lineNumber()})")
                    }
                    return true
                }

                override fun onPermissionRequest(request: PermissionRequest?) {
                    Log.d(TAG, "WebView permission requested: ${request?.resources?.joinToString()}")
                    runOnUiThread {
                        request?.grant(request.resources)
                    }
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = filePathCallback

                    val isCapture = fileChooserParams?.isCaptureEnabled ?: false
                    val pickIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "image/*"
                    }

                    val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    val chooserIntent: Intent

                    if (isCapture) {
                        chooserIntent = Intent.createChooser(takePictureIntent, "Take Photo").apply {
                            putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(pickIntent))
                        }
                    } else {
                        chooserIntent = Intent.createChooser(pickIntent, "Select Image").apply {
                            putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
                        }
                    }

                    try {
                        fileChooserLauncher.launch(chooserIntent)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error launching file chooser", e)
                        try {
                            fileChooserLauncher.launch(pickIntent)
                        } catch (e2: Exception) {
                            this@MainActivity.filePathCallback = null
                            return false
                        }
                    }
                    return true
                }
            }

            loadUrl("https://appassets.androidplatform.net/assets/index.html")
        }
        webView = view
        setContentView(view)

        ViewCompat.setOnApplyWindowInsetsListener(view) { v, windowInsets ->
            val bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val density = v.resources.displayMetrics.density.coerceAtLeast(1f)
            lastTopDp = bars.top / density
            lastBottomDp = bars.bottom / density
            pushAndroidInsets(webView, lastTopDp, lastBottomDp)
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(view)
    }

    override fun onBackPressed() {
        val wv = webView
        if (wv != null) {
            val closeJs = """
                (function(){
                  var d = document;
                  var openChecks = [
                    { sel: '.w-zoomed-card.active, #wZoomedCard.active', fn: function(){ if (window.closeWardrobeZoom) window.closeWardrobeZoom(); } },
                    { sel: '.pw-zoomed-card.pw-zoomed-card--visible', fn: function(){ var b = d.querySelector('.pw-zoomed-close'); if (b) b.click(); } },
                    { sel: '.pw-drawer:not(.pw-drawer--hidden)', fn: function(){ var b = d.querySelector('.pw-close-btn'); if (b) b.click(); } },
                    { sel: '#mannequinDropdownMenu.open, #atmosphereDropdownMenu.open, #mannequinDropdownMenu.show, #atmosphereDropdownMenu.show', fn: function(){ if (window.app && app.toggleMannequinDropdown) app.toggleMannequinDropdown(false); if (window.app && app.toggleAtmosphereDropdown) app.toggleAtmosphereDropdown(false); } },
                    { sel: '.seren-sheet-backdrop:not(.hidden)', fn: function(){ var s = d.querySelector('.seren-sheet-backdrop:not(.hidden)'); if (s && window.app && app.closeSerenSheets) app.closeSerenSheets(); else if (s) s.classList.add('hidden'); } },
                    { sel: '.streak-modal-backdrop:not(.hidden), .sub-modal-backdrop:not(.hidden)', fn: function(){ var b = d.querySelector('.streak-modal-backdrop:not(.hidden) .streak-modal-close, .sub-modal-backdrop:not(.hidden) .sub-modal-close'); if (b) b.click(); } }
                  ];
                  for (var i = 0; i < openChecks.length; i++) {
                    if (d.querySelector(openChecks[i].sel)) {
                      openChecks[i].fn();
                      return 'closed';
                    }
                  }
                  return 'none';
                })();
            """.trimIndent()
            wv.evaluateJavascript(closeJs) { result ->
                if (result != null && result.contains("closed")) {
                    return@evaluateJavascript
                }
                if (wv.canGoBack()) {
                    wv.goBack()
                } else {
                    super@MainActivity.onBackPressed()
                }
            }
        } else {
            super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        webView?.onPause()
        webView?.pauseTimers()
    }

    override fun onResume() {
        super.onResume()
        webView?.onResume()
        webView?.resumeTimers()
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}
