#!/bin/bash

# Start all microservices
echo "Starting Auth Service..."
cd auth-service && npm start &
#cd microservices/auth-service && npm start &

echo "Starting Catalog Service..."
cd catalog-service && npm start &
#cd microservices/catalog-service && npm start &

echo "Starting Order Service..."
cd order-service && npm start &
#cd microservices/order-service && npm start &

echo "Starting Reservation Service..."
cd reservation-service && npm start &
#cd microservices/reservation-service && npm start &

echo "Starting Payment Service..."
cd payment-service && npm start &
#cd microservices/payment-service && npm start &

echo "Starting API Gateway..."
cd api-gateway && npm start &
#cd microservices/api-gateway && npm start &

echo "All services started!"
wait
