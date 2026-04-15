@echo off

echo Starting Auth Service...
start "Auth Service" cmd /k "cd auth-service && npm start"

echo Starting Catalog Service...
start "Catalog Service" cmd /k "cd catalog-service && npm start"

echo Starting Order Service...
start "Order Service" cmd /k "cd order-service && npm start"

echo Starting Reservation Service...
start "Reservation Service" cmd /k "cd reservation-service && npm start"

echo Starting Payment Service...
start "Payment Service" cmd /k "cd payment-service && npm start"

echo Starting Announcements Service...
start "Announcements Service" cmd /k "cd announcements-service && npm run dev"

echo Starting API Gateway...
start "API Gateway" cmd /k "cd api-gateway && npm start"

echo All services started!