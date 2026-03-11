import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduroom.settings')
django.setup()

from django.db import connection

queries = [
    "ALTER TABLE rooms_room ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;",
    "ALTER TABLE content_assignment ADD COLUMN IF NOT EXISTS allow_resubmission boolean DEFAULT false;"
]

print("=== Running DB Schema Hotfixes ===")
with connection.cursor() as cursor:
    for q in queries:
        try:
            cursor.execute(q)
            print(f"OK: {q}")
        except Exception as e:
            # If it's sqlite (e.g. local), IF NOT EXISTS isn't supported for ADD COLUMN in older versions
            # but Postgres supports it. This script is primarily for the server.
            print(f"Failed {q}: {e}")
            
print("=== Done DB Schema Hotfixes ===")
