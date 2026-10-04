#!/bin/bash

case "$1" in
    setup)
        echo "==BENCHMARKER== genetate certs"
        (cd local-benchmarker && ./generate-certs.sh)
        echo "==BENCHMARKER== npm install"
        (cd local-benchmarker && npm install)
        echo "==SERVER== setup"
        (cd server && ./setup-server.sh)
        echo "==CLIENT== npm install"
        (cd client && npm install)
        echo "==CLIENT== build"
        (cd client && npm run build)
        echo "==DONE=="
        ;;

    start)
        mkdir logs

        echo "==BENCHMARKER== run"
        (cd local-benchmarker && npx tsx main.ts "$2") > logs/benchmarker.log 2>&1 &
        echo $! > .benchmarker.pid

        echo "==SERVER== run"
        (cd server && npm run start:prod) > logs/backend.log 2>&1 &
        echo $! > .backend.pid

        echo "==CLIENT== run"
        (cd client && npx serve -s dist -l 5173) > logs/frontend.log 2>&1 &
        echo $! > .frontend.pid
        echo "==DONE=="
        ;;

    stop)
        kill $(cat .backend.pid) 2>/dev/null
        kill $(cat .frontend.pid) 2>/dev/null
        kill $(cat .benchmarker.pid) 2>/dev/null

        rm -f .backend.pid .frontend.pid .benchmarker.pid
        echo "==DONE=="
        ;;

    *)
        echo "Usage: $0 {setup|start <count>|stop}"
        ;;
esac