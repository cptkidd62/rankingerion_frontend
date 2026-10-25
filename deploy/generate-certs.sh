#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <server-ip>"
    exit 1
fi

IP="$1"

command -v mkcert >/dev/null 2>&1 || {
    echo "Error: mkcert is not installed."
    exit 1
}

mkdir -p certs

mkcert -install

mkcert \
    -cert-file certs/rankingerion.crt \
    -key-file certs/rankingerion.key \
    "$IP"

echo "Certificate: certs/rankingerion.crt"
echo "Private key: certs/rankingerion.key"