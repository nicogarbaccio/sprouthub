#!/bin/bash

# Script to remove any remaining font references since we're using system fonts
echo "Updating font references..."

# Find all TypeScript/TSX files and remove any font-inter references
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/font-inter//g'

# Also remove any double spaces that might be left
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/  / /g'

echo "Font references updated!"
echo "Note: Using SF Pro Display/Text (Apple system font) for optimal performance."
