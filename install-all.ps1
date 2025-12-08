# PowerShell script to install all dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Green
npm install

Write-Host "Installing client dependencies..." -ForegroundColor Green
Set-Location client
npm install
Set-Location ..

Write-Host "All dependencies installed successfully!" -ForegroundColor Green
