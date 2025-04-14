import os
import boto3
from botocore.exceptions import ClientError
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a Blueprint for the send survey email API
send_survey_email_bp = Blueprint('send_survey_email', __name__)

@send_survey_email_bp.route('/api/send-survey-email', methods=['POST'])
def send_survey_email_handler():
    """API endpoint to send survey emails to multiple recipients."""
    if not request.json:
        return jsonify({"status": "error", "message": "Missing request body"}), 400
    
    # Get the request data
    emails = request.json.get('emails', [])
    survey_id = request.json.get('survey_id')
    survey_title = request.json.get('survey_title', "Survey Invitation")
    survey_description = request.json.get('survey_description', "")
    
    if not emails or not survey_id:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    results = []
    success_count = 0
    error_count = 0
    
    # Send emails to each recipient
    for email in emails:
        result = send_survey_email(email, survey_id, survey_title, survey_description)
        results.append(result)
        
        if result.get('status') == 'sent':
            success_count += 1
        else:
            error_count += 1
    
    return jsonify({
        "status": "complete",
        "total": len(emails),
        "success": success_count,
        "error": error_count,
        "results": results
    })

def send_survey_email(to_address, survey_id, survey_title="Survey Invitation", survey_description=""):
    """
    Sends an email with a unique survey link to the recipient.
    """
    try:
        # Generate unique survey link
        survey_link = f"https://echoboard.us/survey/{survey_id}"
        
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
