# Start all microservices

Write-Host "Starting Auth Service..."
Start-Process powershell -ArgumentList "cd microservices/auth-service; npm start"

Write-Host "Starting Catalog Service..."
Start-Process powershell -ArgumentList "cd microservices/catalog-service; npm start"

Write-Host "Starting Order Service..."
Start-Process powershell -ArgumentList "cd microservices/order-service; npm start"

Write-Host "Starting Reservation Service..."
Start-Process powershell -ArgumentList "cd microservices/reservation-service; npm start"

Write-Host "Starting Payment Service..."
Start-Process powershell -ArgumentList "cd microservices/payment-service; npm start"

Write-Host "Starting API Gateway..."
Start-Process powershell -ArgumentList "cd microservices/api-gateway; npm start"

Write-Host "All services started!"