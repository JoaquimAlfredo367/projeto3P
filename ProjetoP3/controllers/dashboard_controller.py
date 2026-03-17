from services.api_service import get_users
from models.post_model import get_posts_by_user
from models.comment_model import get_comments

def show_dashboard():

    users = get_users()

    for user in users[:3]:
        print(f"\nUsuário: {user['name']}")

        posts = get_posts_by_user(user["id"])

        for post in posts[:2]:
            print(f"  Post: {post['title']}")

            comments = get_comments(post["id"])

            for comment in comments[:2]:
                print(f"     Comentário: {comment['name']}")