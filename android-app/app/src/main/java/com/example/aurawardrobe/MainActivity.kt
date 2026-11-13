package com.example.aurawardrobe

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import android.view.View
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

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

        // Enable Chrome remote debugging: open chrome://inspect in desktop Chrome
        WebView.setWebContentsDebuggingEnabled(true)

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
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(initBg)
            overScrollMode = View.OVER_SCROLL_NEVER

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

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}
