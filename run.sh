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
        if [ -n "$2" ]; then
            echo "$2" > .benchmarker-count
        fi

        COUNT="${2:-$(cat .benchmarker-count 2>/dev/null || echo 1)}"

        if [ ! -f ".benchmarker.pid" ] && [ ! -f ".backend.pid" ] && [ ! -f ".frontend.pid" ]; then
            mkdir -p logs

            echo "==BENCHMARKER== run"
            (cd local-benchmarker && exec setsid npx tsx main.ts "$COUNT") > logs/benchmarker.log 2>&1 &
            echo $! > .benchmarker.pid

            echo "==SERVER== run"
            (cd server && exec setsid npm run start:prod) > logs/backend.log 2>&1 &
            echo $! > .backend.pid

            echo "==CLIENT== run"
            (cd client && exec setsid npx serve -s dist -l 5173) > logs/frontend.log 2>&1 &
            echo $! > .frontend.pid
            echo "==DONE=="
        fi
        ;;

    stop)
        stop_service() {
            local pid_file="$1"

            if [ -f "$pid_file" ]; then
                local pid
                pid=$(cat "$pid_file")

                if kill -0 "$pid" 2>/dev/null; then
                    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null
                fi

                rm -f "$pid_file"
            fi
        }

        stop_service .backend.pid
        stop_service .frontend.pid
        stop_service .benchmarker.pid

        echo "==DONE=="
        ;;

    restart)
        "$0" stop
        "$0" start "$2"
        ;;

    *)
        echo "Usage: $0 {setup|start <count>|stop|restart <count>}"
        ;;
esac