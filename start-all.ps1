Write-Host "Starting Auth Service..."
Start-Process powershell -ArgumentList "cd auth-service; npm start"

Write-Host "Starting Catalog Service..."
Start-Process powershell -ArgumentList "cd catalog-service; npm start"

Write-Host "Starting Order Service..."
Start-Process powershell -ArgumentList "cd order-service; npm start"

Write-Host "Starting Reservation Service..."
Start-Process powershell -ArgumentList "cd reservation-service; npm start"

Write-Host "Starting Payment Service..."
Start-Process powershell -ArgumentList "cd payment-service; npm start"

Write-Host "Starting Announcements Service..."
Start-Process powershell -ArgumentList "cd announcements-service; npm run dev"

Write-Host "Starting API Gateway..."
Start-Process powershell -ArgumentList "cd api-gateway; npm start"

Write-Host "All services started!"