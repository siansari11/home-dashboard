plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val webAssetsDir = rootProject.file("web-assets")

val copyWebDist = tasks.register<Copy>("copyWebDist") {
    group = "build"
    description = "Copy the Vite dist/ dashboard into Android assets"
    from(rootProject.file("../dist"))
    into(webAssetsDir)
    duplicatesStrategy = DuplicatesStrategy.INCLUDE
    doFirst {
        val index = rootProject.file("../dist/index.html")
        if (!index.isFile) {
            error("Missing $index. From the repo root run: npm install && npm run build")
        }
        if (webAssetsDir.exists()) webAssetsDir.deleteRecursively()
    }
}

android {
    namespace = "com.menzelijaz.homedashboard"
    compileSdk = 35
    buildToolsVersion = "35.0.0"

    defaultConfig {
        applicationId = "com.menzelijaz.homedashboard"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets.named("main") {
        assets.srcDir(webAssetsDir)
    }
}

tasks.named("preBuild").configure {
    dependsOn(copyWebDist)
}

tasks.configureEach {
    if (name.startsWith("merge") && name.endsWith("Assets")) {
        dependsOn(copyWebDist)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
