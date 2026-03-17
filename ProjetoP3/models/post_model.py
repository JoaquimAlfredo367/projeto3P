import requests

BASE_URL = "https://jsonplaceholder.typicode.com"

def get_posts_by_user(user_id):
    try:
        response = requests.get(f"{BASE_URL}/posts?userId={user_id}", timeout=5)
        response.raise_for_status()
        return response.json()
    except:
        return []