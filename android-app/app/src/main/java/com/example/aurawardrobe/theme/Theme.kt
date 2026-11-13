package com.example.aurawardrobe.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
    darkColorScheme(
        primary = WoobiDarkOlive,
        onPrimary = WoobiDarkOnOlive,
        primaryContainer = WoobiOliveDark,
        onPrimaryContainer = WoobiOliveSoft,
        secondary = WoobiDarkSageMuted,
        tertiary = WoobiOliveLight,
        background = WoobiDarkBackground,
        surface = WoobiDarkSurface,
        surfaceVariant = WoobiDarkSurfaceVariant,
        onBackground = WoobiWarmLinen,
        onSurface = WoobiWarmLinen,
        onSurfaceVariant = WoobiDarkSageMuted,
        outline = WoobiDarkOutline,
    )

private val LightColorScheme =
    lightColorScheme(
        primary = WoobiOlivePrimary,
        onPrimary = Color(0xFFFFFFFF),
        primaryContainer = WoobiOliveSoft,
        onPrimaryContainer = WoobiCharcoalInk,
        secondary = WoobiOliveDark,
        onSecondary = Color(0xFFFFFFFF),
        secondaryContainer = WoobiSandstoneTint,
        onSecondaryContainer = WoobiSubtleInk,
        tertiary = WoobiOliveLight,
        background = WoobiWarmLinen,
        surface = WoobiWarmLinen,
        surfaceVariant = WoobiSandstoneTint,
        onBackground = WoobiCharcoalInk,
        onSurface = WoobiCharcoalInk,
        onSurfaceVariant = WoobiSubtleInk,
        outline = WoobiStoneHairline,
    )

@Composable
fun AuraWardrobeTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Dynamic color is available on Android 12+
  dynamicColor: Boolean = true,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }
      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
