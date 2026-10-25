#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 3 ]]; then
    echo "Usage: sudo $0 <server-ip> <certificate-path> <key-path>"
    exit 1
fi

if [[ $EUID -ne 0 ]]; then
    echo "Run this script with sudo."
    exit 1
fi

IP="$1"
CERT="$(realpath -e -- "$2")"
KEY="$(realpath -e -- "$3")"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/nginx.conf"

# Find the main Nginx configuration file.
NGINX="$(command -v nginx)" || {
    echo "Error: nginx is not installed."
    exit 1
}

CONF="$( "$NGINX" -V 2>&1 |
    sed -n 's/.*--conf-path=\([^ ]*\).*/\1/p' )"

[[ -n "$CONF" && -f "$CONF" ]] || {
    echo "Error: could not find the main Nginx configuration."
    echo "Specify the configuration path manually in the script."
    exit 1
}

# Check that the certificate and key exist and are readable by root.
test -r "$CERT" || {
    echo "Error: certificate is not readable: $CERT"
    exit 1
}
test -r "$KEY" || {
    echo "Error: private key is not readable: $KEY"
    exit 1
}

# Avoid breaking Nginx configuration syntax.
for value in "$IP" "$CERT" "$KEY"; do
    if [[ "$value" =~ [\;\{\}\"\'$'\n\r'] ]]; then
        echo "Error: unsupported character in an argument."
        exit 1
    fi
done

# Make a backup before changing anything.
BACKUP="${CONF}.backup.$(date +%Y%m%d%H%M%S)"
cp -p -- "$CONF" "$BACKUP"
echo "Backup created: $BACKUP"
# Escape characters that could affect sed replacement.
escape_sed() {
    printf '%s' "$1" | sed 's/[&|\\]/\\&/g'
}

IP_ESCAPED="$(escape_sed "$IP")"
CERT_ESCAPED="$(escape_sed "$CERT")"
KEY_ESCAPED="$(escape_sed "$KEY")"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

sed \
    -e "s|__SERVER_IP__|$IP_ESCAPED|g" \
    -e "s|__CERT_PATH__|$CERT_ESCAPED|g" \
    -e "s|__KEY_PATH__|$KEY_ESCAPED|g" \
    "$TEMPLATE" > "$TMP"

if grep -Eq '__SERVER_IP__|__CERT_PATH__|__KEY_PATH__' "$TMP"; then
    echo "Error: not all template placeholders were replaced."
    exit 1
fi

# Install the generated config and validate the complete Nginx setup.
install -m 644 "$TMP" "$CONF"

# Test the configuration.
if ! "$NGINX" -t; then
    echo "Configuration test failed; restoring backup."
    cp -p -- "$BACKUP" "$CONF"
    exit 1
fi

# Reload if running; otherwise start it.
if systemctl is-active --quiet nginx; then
    if ! systemctl reload nginx; then
        echo "Reload failed; restoring backup."
        cp -p -- "$BACKUP" "$CONF"
        "$NGINX" -t && systemctl reload nginx
        exit 1
    fi
else
    systemctl enable --now nginx
fi

echo "Nginx configured successfully."
