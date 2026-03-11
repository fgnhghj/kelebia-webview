import requests

url = "http://127.0.0.1:8000/api/auth/login/"
data = {"email": "admin@kelebia.com", "password": "Admin123!"}
res = requests.post(url, json=data)
print("Status:", res.status_code)
print("Response:", res.text)
