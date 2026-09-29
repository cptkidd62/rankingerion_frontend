#!/bin/bash

# Private key for the root cert
openssl genrsa -out private.key 4096

# root certificate
openssl req -x509 -new -nodes -key private.key  -subj "/C=PL/CN=localhost" -sha256 -days 365 -out public.crt

# Private key for the server cert
openssl genrsa -out server.key 2048

# Signing request for the server 
# openssl req -new -key stubhub.key -out stubhub.csr
openssl req -new -key server.key -subj "/C=PL/CN=localhost" -out server.csr

# Server cert using the root certificate
openssl x509 -req -in server.csr -CA public.crt -CAkey private.key -CAcreateserial -out server.crt -days 365 -sha256
