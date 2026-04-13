#!/bin/bash
# Phase 1: GCLB Infrastructure Creation

# Cleanup
gcloud compute health-checks delete arroyo-api-health-check arroyo-api-health-check-canary --quiet || true

# Variables
ZONE=us-central1-a
PROJECT_ID=beta-prime-489121
FRONTEND_IP=10.0.1.2
BACKEND_IP=10.0.1.6

# Create Zonal NEGs
gcloud compute network-endpoint-groups create fe-stable-neg \
    --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE
gcloud compute network-endpoint-groups update fe-stable-neg \
    --zone=$ZONE --add-endpoint="instance=nginx-public-vm,ip=$FRONTEND_IP,port=3000"

gcloud compute network-endpoint-groups create fe-canary-neg \
    --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE
gcloud compute network-endpoint-groups update fe-canary-neg \
    --zone=$ZONE --add-endpoint="instance=nginx-public-vm,ip=$FRONTEND_IP,port=3001"

gcloud compute network-endpoint-groups create be-stable-neg \
    --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE
gcloud compute network-endpoint-groups update be-stable-neg \
    --zone=$ZONE --add-endpoint="instance=private-backend-vm,ip=$BACKEND_IP,port=5000"

gcloud compute network-endpoint-groups create be-canary-neg \
    --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE
gcloud compute network-endpoint-groups update be-canary-neg \
    --zone=$ZONE --add-endpoint="instance=private-backend-vm,ip=$BACKEND_IP,port=5100"

# Health Checks
gcloud compute health-checks create http frontend-health-check --request-path="/healthz" --port=3000
gcloud compute health-checks create http backend-health-check --request-path="/healthz" --port=5000

# Backend Services
gcloud compute backend-services create arroyo-frontend-svc \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTP \
    --health-checks=frontend-health-check \
    --global

gcloud compute backend-services add-backend arroyo-frontend-svc \
    --network-endpoint-group=fe-stable-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE \
    --max-rate-per-endpoint=100 \
    --global
    
gcloud compute backend-services add-backend arroyo-frontend-svc \
    --network-endpoint-group=fe-canary-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE \
    --max-rate-per-endpoint=100 \
    --global

gcloud compute backend-services update arroyo-frontend-svc \
    --global \
    --custom-request-headers="x-frontend-version: canary" \
    --custom-response-header="Set-Cookie: X-Frontend-Version=canary; Path=/; Max-Age=3600" \
    --canary-weight=0

gcloud compute backend-services create arroyo-backend-svc \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTP \
    --health-checks=backend-health-check \
    --session-affinity=GENERATED_COOKIE \
    --global

gcloud compute backend-services add-backend arroyo-backend-svc \
    --network-endpoint-group=be-stable-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE \
    --max-rate-per-endpoint=100 \
    --global
    
gcloud compute backend-services add-backend arroyo-backend-svc \
    --network-endpoint-group=be-canary-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE \
    --max-rate-per-endpoint=100 \
    --global

gcloud compute backend-services update arroyo-backend-svc \
    --global \
    --custom-request-headers="x-frontend-version: canary" \
    --custom-response-header="Set-Cookie: X-Frontend-Version=canary; Path=/; Max-Age=3600" \
    --canary-weight=0

# URL Map & Routing
gcloud compute url-maps create arroyo-url-map --default-service=arroyo-frontend-svc

gcloud compute url-maps add-path-matcher arroyo-url-map \
    --default-service=arroyo-frontend-svc \
    --path-matcher-name=arroyo-path-matcher \
    --path-rules="/api/*=arroyo-backend-svc"

# Proxy & Forwarding
gcloud compute target-http-proxies create arroyo-http-proxy --url-map=arroyo-url-map

gcloud compute addresses create arroyo-global-ip --ip-version=IPV4 --global

IP_ADDRESS=$(gcloud compute addresses describe arroyo-global-ip --format="get(address)" --global)
echo "Global IP Address: $IP_ADDRESS"

gcloud compute forwarding-rules create arroyo-http-forwarding-rule \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address=arroyo-global-ip \
    --target-http-proxy=arroyo-http-proxy \
    --global \
    --ports=80
