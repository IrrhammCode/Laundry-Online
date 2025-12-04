#!/bin/bash
# Vercel build script to inject environment variables
# This script replaces %VITE_API_URL% in HTML files with actual environment variable

# Find and replace in all HTML files
find . -name "*.html" -type f -exec sed -i "s|%VITE_API_URL%|${VITE_API_URL:-http://localhost:3001/api}|g" {} \;

echo "Environment variables injected successfully"

