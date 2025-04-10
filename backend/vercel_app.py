from app import app

# Vercel serverless function handler
def handler(request):
    """Handle requests in Vercel serverless function"""
    if request.method == "POST":
        return app(request)
    return app 