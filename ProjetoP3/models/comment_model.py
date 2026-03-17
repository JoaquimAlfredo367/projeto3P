import requests

BASE_URL = "https://jsonplaceholder.typicode.com"

def get_comments(post_id):
    try:
        response = requests.get(f"{BASE_URL}/comments?postId={post_id}", timeout=5)
        response.raise_for_status()
        return response.json()
    except:
        return []