#!/bin/bash

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Error: Domain name is required."
  echo "Usage: $0 <domain>"
  exit 1
fi

echo "Starting SSL certificate request process for $DOMAIN"

# Check for curl and try to install it if missing
if ! command -v curl >/dev/null 2>&1; then
  echo "curl could not be found. Attempting to install..."
  if command -v apt-get >/dev/null 2>&1; then
      apt-get update && apt-get install -y curl
  else
      echo "Error: curl is required but not installed. Please install curl and try again."
      exit 1
  fi
fi

# Check if acme.sh is installed, install if not
if [ ! -f "$HOME/.acme.sh/acme.sh" ]; then
  echo "Installing acme.sh..."
  if ! curl https://get.acme.sh | sh -s email=admin@$DOMAIN; then
    echo "Error: Failed to install acme.sh"
    exit 1
  fi
fi

# Make sure acme.sh is in PATH or use absolute path
ACME_SH="$HOME/.acme.sh/acme.sh"

# Issue the certificate using webroot mode
echo "Issuing certificate for $DOMAIN using webroot ./dist..."
$ACME_SH --issue -d "$DOMAIN" -w ./dist --server letsencrypt

echo "Certificate issuance process completed."
