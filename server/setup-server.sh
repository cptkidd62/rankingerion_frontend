#!/bin/bash

mkdir certs
cp ../local-benchmarker/certs/ca.pem ../local-benchmarker/certs/client.p12 certs
npm install
