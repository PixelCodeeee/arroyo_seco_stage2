#!/bin/bash
PROJECT_ID=beta-prime-489121

echo "Creating Google-Managed SSL Certificate..."
gcloud compute ssl-certificates create arroyo-managed-cert \
    --domains=arroyoseco.online,www.arroyoseco.online \
    --project=$PROJECT_ID \
    --global

echo "Creating Target HTTPS Proxy..."
gcloud compute target-https-proxies create arroyo-https-proxy \
    --url-map=arroyo-url-map \
    --ssl-certificates=arroyo-managed-cert \
    --project=$PROJECT_ID \
    --global

echo "Creating Global Forwarding Rule for Port 443 (HTTPS)..."
gcloud compute forwarding-rules create arroyo-https-forwarding-rule \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address=arroyo-global-ip \
    --target-https-proxy=arroyo-https-proxy \
    --global \
    --ports=443 \
    --project=$PROJECT_ID

echo "HTTPS Infrastructure Created Successfully!"
