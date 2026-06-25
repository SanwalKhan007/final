#!/bin/bash
set -e

# Build with vercel preset
NITRO_PRESET=vercel npm run build

# Ensure config.json routes all requests to __server function
cat > .vercel/output/config.json << 'JSON'
{
  "version": 3,
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "cache-control": "public, max-age=31536000, immutable" },
      "continue": true
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/__server"
    }
  ]
}
JSON

echo "Build complete with routing config"
