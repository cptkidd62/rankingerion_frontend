#!/bin/bash

if [ ! -e "certs" ]; then
    mkdir certs
fi
cp ../local-benchmarker/certs/ca.pem ../local-benchmarker/certs/client.p12 certs
npm install
npm run build
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
