@echo off

echo Starting Auth Service...
start "Auth Service" cmd /k "cd microservices\auth-service && npm start"

echo Starting Catalog Service...
start "Catalog Service" cmd /k "cd microservices\catalog-service && npm start"

echo Starting Order Service...
start "Order Service" cmd /k "cd microservices\order-service && npm start"

echo Starting Reservation Service...
start "Reservation Service" cmd /k "cd microservices\reservation-service && npm start"

echo Starting Payment Service...
start "Payment Service" cmd /k "cd microservices\payment-service && npm start"

echo Starting API Gateway...
start "API Gateway" cmd /k "cd microservices\api-gateway && npm start"

echo All services started!