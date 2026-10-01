#!/bin/bash

npm install
npm run build
npx serve -s dist -l 5173
