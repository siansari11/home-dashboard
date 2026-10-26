package com.menzelijaz.homedashboard

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat

class SettingsActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val prefs = DashboardPrefs(this)
        val useRemote = findViewById<SwitchCompat>(R.id.useRemote)
        val remoteUrl = findViewById<EditText>(R.id.remoteUrl)
        val startOnBoot = findViewById<SwitchCompat>(R.id.startOnBoot)
        val urlError = findViewById<TextView>(R.id.urlError)

        useRemote.isChecked = prefs.useRemote
        remoteUrl.setText(prefs.remoteUrl)
        startOnBoot.isChecked = prefs.startOnBoot

        findViewById<Button>(R.id.saveSettings).setOnClickListener {
            val typed = remoteUrl.text?.toString()?.trim().orEmpty()
            val remoteOn = useRemote.isChecked
            if (remoteOn && typed.isNotEmpty() && !typed.startsWith("https://") && !typed.startsWith("http://")) {
                urlError.visibility = View.VISIBLE
                return@setOnClickListener
            }
            urlError.visibility = View.GONE
            prefs.useRemote = remoteOn
            prefs.remoteUrl = typed
            prefs.startOnBoot = startOnBoot.isChecked
            if (startOnBoot.isChecked && !Settings.canDrawOverlays(this)) {
                Toast.makeText(this, R.string.overlay_needed, Toast.LENGTH_LONG).show()
                startActivity(
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                )
            }
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
