# Woobi - Release ProGuard / R8 Rules

# Preserve WebKit JavaScript Interface
-keepattributes JavascriptInterface
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve AndroidThemeBridge in MainActivity
-keep class com.example.aurawardrobe.MainActivity$AndroidThemeBridge {
    <methods>;
}

# Preserve Compose Runtime & UI
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Preserve Kotlin Serialization if used
-keepclassmembers class * {
    *** Companion;
}
