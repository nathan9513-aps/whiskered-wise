#!/bin/bash

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Error: Domain name is required."
  echo "Usage: $0 <domain>"
  exit 1
fi

echo "Starting SSL certificate request process for $DOMAIN"

export LE_WORKING_DIR="/app/data/.acme.sh"

# Check if acme.sh is installed, install if not
if [ ! -f "$LE_WORKING_DIR/acme.sh" ]; then
  echo "Installing acme.sh..."
  if ! curl https://get.acme.sh | sh -s email=admin@$DOMAIN; then
    echo "Error: Failed to install acme.sh"
    exit 1
  fi
fi

# Make sure acme.sh is in PATH or use absolute path
ACME_SH="$LE_WORKING_DIR/acme.sh"

# Issue the certificate using webroot mode
echo "Issuing certificate for $DOMAIN using webroot ./dist..."
$ACME_SH --issue -d "$DOMAIN" -w ./dist --server letsencrypt

# Install the certificate to a predictable, persistent location
SSL_DIR="/app/data/ssl"
mkdir -p "$SSL_DIR"

echo "Installing certificate to $SSL_DIR..."
$ACME_SH --install-cert -d "$DOMAIN" \
  --key-file       "$SSL_DIR/$DOMAIN.key"  \
  --fullchain-file "$SSL_DIR/fullchain.cer" \
  --reloadcmd      "echo 'Certificates updated.'"

echo "Certificate issuance process completed."
