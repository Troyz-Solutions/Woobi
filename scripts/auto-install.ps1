$adb = "C:\Users\suriy\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apk = "s:\Fashion_App\woobi.apk"

Write-Host "Monitoring for Motorola phone connection..."
& $adb wait-for-device
Write-Host "Device detected! Installing woobi.apk..."
$res = & $adb install -r -d $apk
Write-Host "Install output: $res"
& $adb shell am start -n com.example.aurawardrobe/.MainActivity
Write-Host "Woobi launched on device successfully!"

