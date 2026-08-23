#!/usr/bin/env bash
# Deploy LuxMap on serveur-prod (Traefik front, Cloudflare TLS edge).
# Run from the repo root: sudo bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

docker build -t luxmap .
docker rm -f luxmap 2>/dev/null || true
docker run -d --name luxmap --restart unless-stopped --network traefik-public \
  -l traefik.enable=true \
  -l 'traefik.http.routers.luxmap.rule=Host(`luxmap.cloudfr.net`)' \
  -l traefik.http.routers.luxmap.entrypoints=websecure \
  -l 'traefik.http.routers.luxmap.tls.certresolver=letsencrypt' \
  -l 'traefik.http.routers.luxmap-web.rule=Host(`luxmap.cloudfr.net`)' \
  -l traefik.http.routers.luxmap-web.entrypoints=web \
  -l 'traefik.http.routers.luxmap-web.service=luxmap' \
  -l 'traefik.http.services.luxmap.loadbalancer.server.port=3003' \
  luxmap

echo "LuxMap deployed (container luxmap, traefik-public, web+websecure+LE)."
