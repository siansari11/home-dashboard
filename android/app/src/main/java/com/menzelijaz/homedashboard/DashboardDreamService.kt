package com.menzelijaz.homedashboard

import android.service.dreams.DreamService
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebView

class DashboardDreamService : DreamService() {
    private var webView: WebView? = null

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isInteractive = false
        isFullscreen = true
        isScreenBright = true
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val view = WebView(this)
        view.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        DashboardWeb.prepare(view, null)
        webView = view
        setContentView(view)
        DashboardWeb.load(this, view)
    }

    override fun onDetachedFromWindow() {
        webView?.apply {
            stopLoading()
            destroy()
        }
        webView = null
        super.onDetachedFromWindow()
    }
}
