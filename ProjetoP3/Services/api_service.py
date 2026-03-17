import requests

BASE_URL = "https://jsonplaceholder.typicode.com"

def get_users():
    try:
        response = requests.get(f"{BASE_URL}/users", timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print("Erro: tempo de resposta excedido")
        return []
    except requests.exceptions.RequestException:
        print("Erro de conexão com API")
        return []