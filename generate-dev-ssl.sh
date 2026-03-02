#!/bin/bash

SSL_DIR="./ssl"

if [ ! -d "$SSL_DIR" ]; then
  mkdir -p "$SSL_DIR"
fi

if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
  echo "Development certificates already exist in $SSL_DIR"
  exit 0
fi

echo "Generating self-signed certificates for development..."

openssl req -x509 -newkey rsa:2048 -keyout "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 -nodes -subj "/CN=localhost"

if [ $? -eq 0 ]; then
  echo "Certificates generated successfully in $SSL_DIR"
else
  echo "Error generating certificates"
  exit 1
fi
