#!/bin/bash
cd /home/ubuntu/eduroom/frontend/src

echo "=== Files using useEffect without importing it ==="
for f in $(grep -rl "useEffect" --include="*.jsx" --include="*.js" .); do
    if ! grep -q "import.*useEffect" "$f"; then
        echo "MISSING IMPORT: $f"
        head -5 "$f"
        echo "---"
    fi
done

echo ""
echo "=== All files with useEffect ==="
grep -rn "useEffect" --include="*.jsx" --include="*.js" . | head -30
