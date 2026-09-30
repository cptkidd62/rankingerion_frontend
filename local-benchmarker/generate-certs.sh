#!/bin/bash

set -e

CERT_DIR="certs"
DAYS=3650

mkdir -p "$CERT_DIR"

echo "Generating CA..."
openssl genrsa -out "$CERT_DIR/ca.key" 4096

openssl req -x509 -new -nodes \
    -key "$CERT_DIR/ca.key" \
    -sha256 \
    -days "$DAYS" \
    -out "$CERT_DIR/ca.pem" \
    -subj "/CN=Local Test CA"

echo "Generating server certificate..."
openssl genrsa -out "$CERT_DIR/server.key" 2048

openssl req -new \
    -key "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.csr" \
    -subj "/CN=localhost"

cat > "$CERT_DIR/server.ext" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost
EOF

openssl x509 -req \
    -in "$CERT_DIR/server.csr" \
    -CA "$CERT_DIR/ca.pem" \
    -CAkey "$CERT_DIR/ca.key" \
    -CAcreateserial \
    -out "$CERT_DIR/server.pem" \
    -days "$DAYS" \
    -sha256 \
    -extfile "$CERT_DIR/server.ext"

echo "Generating client certificate..."
openssl genrsa -out "$CERT_DIR/client.key" 2048

openssl req -new \
    -key "$CERT_DIR/client.key" \
    -out "$CERT_DIR/client.csr" \
    -subj "/CN=Local Test Client"

cat > "$CERT_DIR/client.ext" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
EOF

openssl x509 -req \
    -in "$CERT_DIR/client.csr" \
    -CA "$CERT_DIR/ca.pem" \
    -CAkey "$CERT_DIR/ca.key" \
    -CAcreateserial \
    -out "$CERT_DIR/client.pem" \
    -days "$DAYS" \
    -sha256 \
    -extfile "$CERT_DIR/client.ext"

echo "Generating server PFX..."
openssl pkcs12 -export \
    -out "$CERT_DIR/server.p12" \
    -inkey "$CERT_DIR/server.key" \
    -in "$CERT_DIR/server.pem" \
    -certfile "$CERT_DIR/ca.pem" \
    -name "local-test-server"

echo "Generating client PFX..."
openssl pkcs12 -export \
    -out "$CERT_DIR/client.p12" \
    -inkey "$CERT_DIR/client.key" \
    -in "$CERT_DIR/client.pem" \
    -certfile "$CERT_DIR/ca.pem" \
    -name "local-test-client"

echo "Done."
