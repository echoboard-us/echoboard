from app import app
from flask import request
import boto3
from botocore.exceptions import ClientError
import os

# Load environment variables from .env file
load_dotenv()

# Check for AWS SES credentials
aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
aws_region = os.environ.get("AWS_SES_REGION")
email_source = os.environ.get("EMAIL_SOURCE")

if not all([aws_access_key, aws_secret_key, aws_region, email_source]):
    print("Warning: AWS SES credentials not found in environment variables")
else:
    print("AWS SES credentials loaded successfully.")

# Function to send survey email
def send_survey_email(to_address, survey_id, survey_title="Survey Invitation", survey_description="", survey_link=None):
    """
    Sends an email with a unique survey link to the recipient.
    """
    try:
        # Generate unique survey link if not provided
        if not survey_link:
            survey_link = f"https://www.echoboard.us/survey/{survey_id}"
        
        # Initialize SES client
        ses_client = boto3.client(
            'ses',
            region_name=os.getenv("AWS_SES_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        
        # Create email HTML content
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4a69bd; color: white; padding: 10px 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .button {{ display: inline-block; background-color: #4a69bd; color: white; padding: 10px 20px; 
                           text-decoration: none; border-radius: 4px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>EchoBoard Survey Invitation</h2>
                </div>
                <div class="content">
                    <h3>{survey_title}</h3>
                    <p>{survey_description}</p>
                    <p>You've been invited to participate in a survey. Your feedback is important to us.</p>
                    <p><a href="{survey_link}" class="button">Take the Survey</a></p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>{survey_link}</p>
                </div>
                <div class="footer">
                    <p>This email was sent by EchoBoard. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email
        response = ses_client.send_email(
            Source=os.getenv("EMAIL_SOURCE"),
            Destination={'ToAddresses': [to_address]},
            Message={
                'Subject': {'Data': f"Survey Invitation: {survey_title}"},
                'Body': {
                    'Text': {'Data': f"You've been invited to take a survey: {survey_title}\n\n{survey_description}\n\nPlease complete the survey at this link:\n{survey_link}"},
                    'Html': {'Data': html_content}
                }
            }
        )
        return {"status": "sent", "email": to_address, "message_id": response['MessageId']}
    except ClientError as e:
        return {"status": "error", "email": to_address, "message": str(e)}
    except Exception as e:
        return {"status": "error", "email": to_address, "message": f"Unexpected error: {str(e)}"}

# Vercel serverless function handler
def handler(request):
    """Handle requests in Vercel serverless function"""
    if request.method == "POST":
        return app.handle_request(request)
    elif request.method == "GET":
        return app.handle_request(request)
    return app.handle_request(request) 

    # deploy with vercel make changes to deploy
    # vercel --prod...
    # vercel --prod...