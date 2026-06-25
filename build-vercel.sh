#!/bin/bash
set -e

# Build with vercel preset
NITRO_PRESET=vercel npm run build

# Print what nitro generated for debugging
echo "=== Nitro generated config.json ==="
cat .vercel/output/config.json 2>/dev/null || echo "No config.json found"

echo "=== Functions directory ==="
ls .vercel/output/functions/ 2>/dev/null || echo "No functions directory"

# Override config.json to route all requests to __server function
cat > .vercel/output/config.json << 'JSON'
{
  "version": 3,
  "routes": [
    {
      "src": "^/assets/(.*)$",
      "headers": { "cache-control": "public, max-age=31536000, immutable" },
      "continue": true
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "^/(.*)$",
      "dest": "/__server"
    }
  ]
}
JSON

echo "=== Final config.json ==="
cat .vercel/output/config.json

echo "Build complete!"
