# Sync the latest site from the Claude scratchpad into TailsCodex and deploy to 12tails-codex.pages.dev
param([string]$Src = "C:\Users\User\AppData\Local\Temp\claude\C--Users-User\0dc5737c-d204-4312-bdf5-11fc8ae4c1ab\scratchpad\site")
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $here "dist"

# stop preview server and drop test pages
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like "*http.server 8765*" } | ForEach-Object { Stop-Process -Id $_.ProcessId }
Get-ChildItem -LiteralPath $Src -Filter "c?.html" | ForEach-Object { Remove-Item -LiteralPath $_.FullName }

# wrap the artifact fragment into a full HTML document
$body = [IO.File]::ReadAllText((Join-Path $Src "index.html"))
$html = "<!doctype html>`n<html lang=`"th`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover`">`n<style>[hidden]{display:none!important}img{max-width:100%}</style>`n</head>`n<body>`n$body`n</body>`n</html>`n"
foreach ($p in (Join-Path $here "index.html"), (Join-Path $dist "index.html")) { [IO.File]::WriteAllText($p, $html, [Text.UTF8Encoding]::new($false)) }
foreach ($f in "data.json", "img-art.json", "img-hero.json", "img-icon.json", "img-mon.json", "img-skill.json", "logo.webp", "bgm.mp3", "srv-tailstopia.webp", "srv-other.webp", "wardrobe.json", "maps.json") {
  Copy-Item -LiteralPath (Join-Path $Src $f) -Destination $here -Force
  Copy-Item -LiteralPath (Join-Path $Src $f) -Destination $dist -Force
}

foreach ($t in $here, $dist) { Copy-Item -LiteralPath (Join-Path $Src "wd") -Destination $t -Recurse -Force; Copy-Item -LiteralPath (Join-Path $Src "maps") -Destination $t -Recurse -Force }
Push-Location $dist
npx --yes wrangler@latest pages deploy . --project-name 12tails-codex --branch main --commit-dirty=true 2>&1 |
  Select-String -NotMatch 'npm notice|NativeCommandError|CategoryInfo|FullyQualified|At line|RemoteException' | Select-Object -Last 2
Pop-Location
