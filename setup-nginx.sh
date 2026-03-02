#!/bin/bash
# Setup script for Nginx configuration

set -e

echo "=== Nginx Setup for Whiskered-Wise ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Copy configuration
echo "Copying Nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/whiskered-wise

# Enable site
ln -sf /etc/nginx/sites-available/whiskered-wise /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Ensure SSL directory exists
mkdir -p /app/data/ssl

# Check if SSL certificates exist, if not, create self-signed temporary ones
if [ ! -f /app/data/ssl/fullchain.cer ] || [ ! -f /app/data/ssl/barbershopmarrakesh.com.key ]; then
    echo "SSL certificates not found. Generating temporary self-signed certificates so Nginx can start..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /app/data/ssl/barbershopmarrakesh.com.key \
        -out /app/data/ssl/fullchain.cer \
        -subj "/C=IT/ST=State/L=City/O=Organization/CN=barbershopmarrakesh.com"
fi

# Test configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

echo "=== Setup complete! ==="
echo "Nginx is now configured to:"
echo "  - Redirect HTTP (port 80) to HTTPS (port 443)"
echo "  - Proxy requests to Node.js backend on port 3001"
echo "  - Serve static files with caching"
echo ""
echo "Make sure your SSL certificates are in place:"
echo "  - /app/data/ssl/fullchain.cer"
echo "  - /app/data/ssl/barbershopmarrakesh.com.key"
