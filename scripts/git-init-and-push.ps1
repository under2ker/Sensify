# Первый push в GitHub: https://github.com/under2ker/Sensify
# Запуск из корня проекта:
#   powershell -ExecutionPolicy Bypass -File scripts/git-init-and-push.ps1
# Требуется: Git в PATH и вход в GitHub (HTTPS или SSH).

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$remote = "https://github.com/under2ker/Sensify.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git не найден в PATH. Установите Git: https://git-scm.com/download/win и перезапустите терминал."
}

if (-not (Test-Path ".git")) {
  git init
  git branch -M main
}

git remote remove origin 2>$null
git remote add origin $remote

git add -A
git status

$msg = if ($args[0]) { $args[0] } else { "chore: initial import Sensify" }
git diff --cached --quiet
# exit 1 = есть что коммитить; exit 0 = индекс пуст относительно HEAD
if ($LASTEXITCODE -eq 1) {
  git commit -m $msg
} else {
  Write-Host "Нет новых изменений для коммита (или уже всё закоммичено)."
}

git push -u origin main

Write-Host "Готово: $remote"
