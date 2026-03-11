import requests
import sys

URL = "https://isetkl-classroom.gleeze.com/api"

print("1. Logging in as admin...")
login_res = requests.post(
    f"{URL}/auth/login/",
    json={"email": "admin@kelebia.com", "password": "Admin123!"}
)
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    sys.exit(1)

token = login_res.json()["tokens"]["access"]
headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

print("\n2. Getting current AppVersion settings...")
get_res = requests.get(f"{URL}/app-version/")
print(get_res.json())

print("\n3. Locking the App...")
patch_data = {
    "is_locked": True,
    "message": "This is a test lock.",
    "update_link": "https://google.com/"
}
patch_res = requests.patch(f"{URL}/app-version/", json=patch_data, headers=headers)
print("Patch Status:", patch_res.status_code)
if patch_res.status_code != 200:
    print(patch_res.text)

print("\n4. Verifying AppVersion settings...")
verify_res = requests.get(f"{URL}/app-version/")
print(verify_res.json())

print("\n5. Unlocking the App...")
unlock_data = {"is_locked": False}
requests.patch(f"{URL}/app-version/", json=unlock_data, headers=headers)
print("Unlocked successfully")

