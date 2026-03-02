#!/bin/bash

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Error: Domain name is required."
  echo "Usage: $0 <domain>"
  exit 1
fi

echo "Starting SSL certificate request process for $DOMAIN"

# Check if acme.sh is installed, install if not
if [ ! -f "$HOME/.acme.sh/acme.sh" ]; then
  echo "Installing acme.sh..."
  curl https://get.acme.sh | sh -s email=admin@$DOMAIN
fi

# Make sure acme.sh is in PATH or use absolute path
ACME_SH="$HOME/.acme.sh/acme.sh"

# Issue the certificate using webroot mode
echo "Issuing certificate for $DOMAIN using webroot ./dist..."
$ACME_SH --issue -d "$DOMAIN" -w ./dist --server letsencrypt

echo "Certificate issuance process completed."
