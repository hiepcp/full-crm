# ===============================
# SHARE FOLDER CHỈ CHO ACC02\admin
# RUN ON: ACC01
# REQUIRE: Run as Administrator
# ===============================

# ===== CONFIG =====
$FolderPath = "D:\01. DATA ACC - SHARE"
$ShareName  = "DATA_ACC"
$RemoteUser = "ACC02\admin"
$LocalUser  = "ACC01\admin"

Write-Host "=== START CONFIG SHARE ==="

# ===== CHECK FOLDER =====
if (!(Test-Path $FolderPath)) {
    Write-Error "❌ Folder không tồn tại: $FolderPath"
    exit 1
}

# ===== REMOVE SHARE IF EXISTS =====
if (Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue) {
    Write-Host "→ Removing existing share..."
    Remove-SmbShare -Name $ShareName -Force
}

# ===== CREATE SMB SHARE =====
Write-Host "→ Creating SMB share..."
New-SmbShare `
    -Name $ShareName `
    -Path $FolderPath `
    -FullAccess $RemoteUser `
    -Description "Share only for ACC02 admin" `
    -FolderEnumerationMode AccessBased

# ===== NTFS PERMISSION =====
Write-Host "→ Configuring NTFS permissions..."

# Tắt kế thừa
icacls "$FolderPath" /inheritance:r | Out-Null

# Xóa quyền Everyone & Users
icacls "$FolderPath" /remove:g Everyone Users | Out-Null

# Cấp quyền cho ACC02 admin
icacls "$FolderPath" /grant "$RemoteUser:(OI)(CI)F" | Out-Null

# Giữ quyền cho ACC01 admin
icacls "$FolderPath" /grant "$LocalUser:(OI)(CI)F" | Out-Null

# ===== VERIFY =====
Write-Host ""
Write-Host "=== VERIFY RESULT ==="
net share $ShareName
icacls "$FolderPath"

Write-Host ""
Write-Host "✔ DONE!"
Write-Host "→ Access from ACC02:  \\ACC01\$ShareName"
