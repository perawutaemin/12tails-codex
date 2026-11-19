# Sync the latest site from the Claude scratchpad into TailsCodex and publish to GitHub Pages
param([string]$Src = "C:\Users\User\AppData\Local\Temp\claude\C--Users-User\0dc5737c-d204-4312-bdf5-11fc8ae4c1ab\scratchpad\site")
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $here "dist"

# stop preview server and drop test pages
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like "*http.server 8765*" } | ForEach-Object { Stop-Process -Id $_.ProcessId }
Get-ChildItem -LiteralPath $Src -Filter "c?.html" | ForEach-Object { Remove-Item -LiteralPath $_.FullName }

# wrap the artifact fragment into a full HTML document
$body = [IO.File]::ReadAllText((Join-Path $Src "index.html"))
$html = "<!doctype html>`n<html lang=`"th`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover`">`n<link rel=`"icon`" type=`"image/png`" sizes=`"32x32`" href=`"favicon-32.png`">`n<link rel=`"icon`" type=`"image/png`" sizes=`"512x512`" href=`"favicon.png`">`n<link rel=`"apple-touch-icon`" href=`"apple-touch-icon.png`">`n<style>[hidden]{display:none!important}img{max-width:100%}</style>`n</head>`n<body>`n$body`n</body>`n</html>`n"
foreach ($p in (Join-Path $here "index.html"), (Join-Path $dist "index.html")) { [IO.File]::WriteAllText($p, $html, [Text.UTF8Encoding]::new($false)) }
foreach ($f in "data.json", "img-art.json", "img-hero.json", "img-icon.json", "img-mon.json", "img-skill.json", "logo.webp", "bgm.mp3", "srv-tailstopia.webp", "srv-other.webp", "favicon.png", "favicon-32.png", "apple-touch-icon.png", "wardrobe.json", "maps.json") {
  Copy-Item -LiteralPath (Join-Path $Src $f) -Destination $here -Force
  Copy-Item -LiteralPath (Join-Path $Src $f) -Destination $dist -Force
}

foreach ($t in $here, $dist) { Copy-Item -LiteralPath (Join-Path $Src "wd") -Destination $t -Recurse -Force; Copy-Item -LiteralPath (Join-Path $Src "maps") -Destination $t -Recurse -Force }
Push-Location $here
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
git add -A 2>$null
git commit -q -m ("Update site " + (Get-Date -Format "yyyy-MM-dd HH:mm")) 2>$null
git push -q 2>$null
Write-Output ("Pushed " + (git log --oneline -1))
Pop-Location
