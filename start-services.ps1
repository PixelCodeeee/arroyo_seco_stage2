Write-Host "Starting Microservices..." -ForegroundColor Cyan

# Auth Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\auth-service'; Write-Host 'AUTH SERVICE RUNNING ON PORT 5001' -ForegroundColor Green; npm start"

# Catalog Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\catalog-service'; Write-Host 'CATALOG SERVICE RUNNING ON PORT 5002' -ForegroundColor Green; npm start"

# Order Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\order-service'; Write-Host 'ORDER SERVICE RUNNING ON PORT 5003' -ForegroundColor Green; npm start"

# Reservation Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\reservation-service'; Write-Host 'RESERVATION SERVICE RUNNING ON PORT 5004' -ForegroundColor Green; npm start"

# Payment Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\payment-service'; Write-Host 'PAYMENT SERVICE RUNNING ON PORT 5005' -ForegroundColor Green; npm start"

# API Gateway
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\api-gateway'; Write-Host 'API GATEWAY RUNNING ON PORT 3000' -ForegroundColor Green; npm start"

# Review Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KF\Documents\10mo-cuatri\Integradora\arroyo_seco_stage2-main\review-service'; Write-Host 'REVIEW SERVICE RUNNING ON PORT 5006' -ForegroundColor Green; npm start"


Write-Host ""
Write-Host "All microservices started!" -ForegroundColor Cyan
Write-Host "Auth -> http://localhost:5001"
Write-Host "Catalog -> http://localhost:5002"
Write-Host "Order -> http://localhost:5003"
Write-Host "Reservation -> http://localhost:5004"
Write-Host "Payment -> http://localhost:5005"
Write-Host "Gateway -> http://localhost:3000"
Write-Host "Review -> http://localhost:5007"