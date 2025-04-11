from app import app
from flask import request

# Vercel serverless function handler
def handler(request):
    """Handle requests in Vercel serverless function"""
    if request.method == "POST":
        return app.handle_request(request)
    elif request.method == "GET":
        return app.handle_request(request)
    return app.handle_request(request) 