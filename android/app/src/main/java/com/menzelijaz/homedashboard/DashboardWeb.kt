package com.menzelijaz.homedashboard

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

object DashboardWeb {
    @SuppressLint("SetJavaScriptEnabled")
    fun prepare(webView: WebView, bridge: AndroidBridge?) {
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/home-dashboard/", WebViewAssetLoader.AssetsPathHandler(webView.context))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            loadsImagesAutomatically = true
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        val cookies = CookieManager.getInstance()
        cookies.setAcceptCookie(true)
        cookies.setAcceptThirdPartyCookies(webView, true)

        if (bridge != null) {
            webView.addJavascriptInterface(bridge, "HomeDashboard")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return loader.shouldInterceptRequest(request.url)
            }
        }
    }

    fun load(context: Context, webView: WebView) {
        val prefs = DashboardPrefs(context)
        val remote = prefs.remoteUrl.trim()
        val remoteOk = remote.startsWith("https://") || remote.startsWith("http://")
        val url = if (prefs.useRemote && remoteOk) remote else DashboardPrefs.LOCAL_URL
        webView.loadUrl(url)
    }
}
