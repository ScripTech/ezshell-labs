#!/bin/bash

# Generate self-signed SSL certificates for development
# This script creates certificates for localhost and ezshell.local

CERT_DIR="/etc/nginx/ssl"
COUNTRY="US"
STATE="Development"
CITY="Development"
ORGANIZATION="EZShell Labs"
ORGANIZATIONAL_UNIT="IT Department"
COMMON_NAME="ezshell.local"

echo "Generating self-signed SSL certificates for development..."

# Create certificate directory if it doesn't exist
mkdir -p "${CERT_DIR}"

# Generate private key
openssl genrsa -out "${CERT_DIR}/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "${CERT_DIR}/key.pem" -out "${CERT_DIR}/cert.csr" -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORGANIZATION}/OU=${ORGANIZATIONAL_UNIT}/CN=${COMMON_NAME}"

# Generate self-signed certificate
openssl x509 -req -in "${CERT_DIR}/cert.csr" -signkey "${CERT_DIR}/key.pem" -out "${CERT_DIR}/cert.pem" -days 365 -extensions v3_req -extfile <(cat <<EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ezshell.local
DNS.3 = *.ezshell.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Set appropriate permissions
chmod 600 "${CERT_DIR}/key.pem"
chmod 644 "${CERT_DIR}/cert.pem"

# Clean up CSR
rm "${CERT_DIR}/cert.csr"

echo "SSL certificates generated successfully!"
echo "Certificate: ${CERT_DIR}/cert.pem"
echo "Private Key: ${CERT_DIR}/key.pem"
echo ""
echo "To use HTTPS, uncomment the HTTPS server block in nginx/conf.d/ezshell.conf"
echo "and restart the docker-compose stack."
