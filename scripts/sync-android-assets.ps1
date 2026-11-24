# Woobi - Synchronize Optimized Web Assets to Android App Assets
$src = (Resolve-Path "$PSScriptRoot\..").Path
$dest = Join-Path $src "android-app\app\src\main\assets"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
}

# 1. Core Web and Script Assets
$coreFiles = @(
    "index.html",
    "app.js",
    "styles.css",
    "three.min.js",
    "studio3d.js",
    "wardrobe3d.js",
    "wardrobe-astra-material.js",
    "studio-assets.html"
)

foreach ($f in $coreFiles) {
    $filePath = Join-Path $src $f
    if (Test-Path $filePath) {
        Copy-Item $filePath (Join-Path $dest $f) -Force
    }
}

# 2. Canonical Unique 3D Models (Single copy of each to prevent 95+ MB bloat)
$unique3DModels = @(
    "wardrobe.glb",
    "woobi_vanity.glb",
    "seren_stage.glb",
    "avatar_female.glb",
    "avatar_male.glb",
    "Woobi_Female_Mannequin_Fixed.glb",
    "woobi_male_mannequin.glb"
)

foreach ($m in $unique3DModels) {
    $mPath = Join-Path $src $m
    if (Test-Path $mPath) {
        Copy-Item $mPath (Join-Path $dest $m) -Force
    }
}

# 3. Copy assets folder (Images, UI icons, audio)
Copy-Item (Join-Path $src "assets") $dest -Recurse -Force

# 4. Copy libs folder (Three.js plugins, OrbitControls, GLTFLoader, Meshopt)
$libsDest = Join-Path $dest "libs"
if (-not (Test-Path $libsDest)) {
    New-Item -ItemType Directory -Force -Path $libsDest | Out-Null
}
Copy-Item (Join-Path $src "libs\*") $libsDest -Recurse -Force

# 5. Copy modules folder
Copy-Item (Join-Path $src "modules") $dest -Recurse -Force

# 6. Copy engine-harmony folder
$harmonySrc = Join-Path $src "engine-harmony"
if (Test-Path $harmonySrc) {
    Copy-Item $harmonySrc $dest -Recurse -Force
}

# 7. Purge Obsolete Duplicate 3D Folders & Redundant Files from Android Assets (Cuts 95+ MB bloat!)
$redundantFolders = @(
    "3D - Mirror and stuffs",
    "3D- Wardrobe by Astra",
    "3D - Stage by Astra",
    "3D - Mannequin By Astra",
    "Clock"
)
foreach ($rf in $redundantFolders) {
    $rfPath = Join-Path $dest $rf
    if (Test-Path $rfPath) {
        Remove-Item -Path $rfPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$redundantFiles = @(
    "seren_avatar.glb",
    "wardrobe-revised-compressed.glb",
    "seren_vanity.glb",
    "woobi_female_mannequin.glb",
    "Woobi_Female_Mannequin.glb",
    "assets\models\avatar_female.glb",
    "assets\models\avatar_male.glb"
)
foreach ($rf in $redundantFiles) {
    $rfPath = Join-Path $dest $rf
    if (Test-Path $rfPath) {
        Remove-Item -Path $rfPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "[SUCCESS] Assets synchronized & 95+ MB duplicate bloat purged successfully."
