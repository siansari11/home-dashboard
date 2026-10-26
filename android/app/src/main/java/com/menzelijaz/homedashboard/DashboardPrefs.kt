package com.menzelijaz.homedashboard

import android.content.Context

class DashboardPrefs(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    var useRemote: Boolean
        get() = prefs.getBoolean(KEY_USE_REMOTE, false)
        set(value) {
            prefs.edit().putBoolean(KEY_USE_REMOTE, value).apply()
        }

    var remoteUrl: String
        get() = prefs.getString(KEY_REMOTE_URL, DEFAULT_REMOTE_URL) ?: DEFAULT_REMOTE_URL
        set(value) {
            val trimmed = value.trim().ifBlank { DEFAULT_REMOTE_URL }
            prefs.edit().putString(KEY_REMOTE_URL, trimmed).apply()
        }

    var startOnBoot: Boolean
        get() = prefs.getBoolean(KEY_START_ON_BOOT, false)
        set(value) {
            prefs.edit().putBoolean(KEY_START_ON_BOOT, value).apply()
        }

    companion object {
        private const val PREFS = "home_dashboard"
        private const val KEY_USE_REMOTE = "use_remote"
        private const val KEY_REMOTE_URL = "remote_url"
        private const val KEY_START_ON_BOOT = "start_on_boot"

        const val DEFAULT_REMOTE_URL = "https://siansari11.github.io/home-dashboard/"

        // Vite base is /home-dashboard/, so the asset handler uses that prefix.
        const val LOCAL_URL = "https://appassets.androidplatform.net/home-dashboard/index.html"
    }
}
