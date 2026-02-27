#!/bin/bash

# Start all microservices
echo "Starting Auth Service..."
cd microservices/auth-service && npm start &

echo "Starting Catalog Service..."
cd microservices/catalog-service && npm start &

echo "Starting Order Service..."
cd microservices/order-service && npm start &

echo "Starting Reservation Service..."
cd microservices/reservation-service && npm start &

echo "Starting Payment Service..."
cd microservices/payment-service && npm start &

echo "Starting API Gateway..."
cd microservices/api-gateway && npm start &

echo "All services started!"
wait
