#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <server-ip>"
    exit 1
fi

IP="$1"

CERT_DIR="$SCRIPT_DIR/certs"
CERT="$CERT_DIR/rankingerion.crt"
KEY="$CERT_DIR/rankingerion.key"

echo "==> Generating certificate..."
"$SCRIPT_DIR/generate-certs.sh" "$IP"

echo "==> Configuring Nginx..."
sudo "$SCRIPT_DIR/setup-nginx.sh" "$IP" "$CERT" "$KEY"

echo
echo "Setup completed."
