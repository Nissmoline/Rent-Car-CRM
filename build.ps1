# PowerShell script to build the application
Write-Host "Installing client dependencies..." -ForegroundColor Green
Set-Location client
npm install

Write-Host "Building client..." -ForegroundColor Green
npm run build
Set-Location ..

Write-Host "Build completed successfully!" -ForegroundColor Green
