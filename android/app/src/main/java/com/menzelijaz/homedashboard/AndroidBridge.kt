package com.menzelijaz.homedashboard

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface

class AndroidBridge(private val activity: Activity) {
    @JavascriptInterface
    fun openSettings() {
        activity.runOnUiThread {
            activity.startActivity(Intent(activity, SettingsActivity::class.java))
        }
    }
}
