#!/bin/bash
# Phase 1.1: Corrected GCLB Infrastructure for URL-map based Splitting

ZONE=us-central1-a
PROJECT_ID=beta-prime-489121
FRONTEND_IP=10.0.1.2
BACKEND_IP=10.0.1.6

# 1. Temporarily detach old backend services from URL Map so they can be deleted
gcloud compute url-maps add-path-matcher arroyo-url-map \
    --default-service=arroyo-frontend-svc \
    --path-matcher-name=arroyo-path-matcher \
    --path-rules="/api/*=arroyo-frontend-svc" \
    --global --quiet 2>/dev/null || true

gcloud compute url-maps remove-path-matcher arroyo-url-map \
    --path-matcher-name=arroyo-path-matcher \
    --global --quiet 2>/dev/null || true

# 2. Cleanup old resources
gcloud compute backend-services delete arroyo-frontend-svc arroyo-backend-svc --global --quiet 2>/dev/null || true

# NEGs should already exist, but ensure they are up to date
gcloud compute network-endpoint-groups create fe-stable-neg --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE 2>/dev/null || true
gcloud compute network-endpoint-groups create fe-canary-neg --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE 2>/dev/null || true
gcloud compute network-endpoint-groups create be-stable-neg --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE 2>/dev/null || true
gcloud compute network-endpoint-groups create be-canary-neg --network-endpoint-type=GCE_VM_IP_PORT --zone=$ZONE 2>/dev/null || true

# Health Checks
gcloud compute health-checks create http frontend-health-check --request-path="/healthz" --port=3000 2>/dev/null || true
gcloud compute health-checks create http backend-health-check --request-path="/healthz" --port=5000 2>/dev/null || true

# ==============================================================
# 3. Create 4 Distinct Backend Services for weight splitting
# ==============================================================

# FRONTEND STABLE
gcloud compute backend-services create arroyo-frontend-svc-stable \
    --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP \
    --health-checks=frontend-health-check --global
gcloud compute backend-services add-backend arroyo-frontend-svc-stable \
    --network-endpoint-group=fe-stable-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE --max-rate-per-endpoint=100 --global

# FRONTEND CANARY
gcloud compute backend-services create arroyo-frontend-svc-canary \
    --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP \
    --health-checks=frontend-health-check --global
gcloud compute backend-services add-backend arroyo-frontend-svc-canary \
    --network-endpoint-group=fe-canary-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE --max-rate-per-endpoint=100 --global

# BACKEND STABLE
gcloud compute backend-services create arroyo-backend-svc-stable \
    --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP \
    --health-checks=backend-health-check --session-affinity=GENERATED_COOKIE --global
gcloud compute backend-services add-backend arroyo-backend-svc-stable \
    --network-endpoint-group=be-stable-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE --max-rate-per-endpoint=100 --global

# BACKEND CANARY
gcloud compute backend-services create arroyo-backend-svc-canary \
    --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP \
    --health-checks=backend-health-check --session-affinity=GENERATED_COOKIE --global
gcloud compute backend-services add-backend arroyo-backend-svc-canary \
    --network-endpoint-group=be-canary-neg \
    --network-endpoint-group-zone=$ZONE \
    --balancing-mode=RATE --max-rate-per-endpoint=100 --global


# ==============================================================
# 4. Re-configure URL Map Base Routing (100% to Stable initially)
# ==============================================================
gcloud compute url-maps set-default-service arroyo-url-map \
    --default-service=arroyo-frontend-svc-stable --global --quiet 2>/dev/null || true

gcloud compute url-maps add-path-matcher arroyo-url-map \
    --default-service=arroyo-frontend-svc-stable \
    --path-matcher-name=arroyo-path-matcher \
    --path-rules="/api/*=arroyo-backend-svc-stable" \
    --global

echo "Successfully re-architected GCLB to 4-service layout for URL map splitting!"
