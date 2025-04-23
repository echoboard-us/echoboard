import os
from flask import Flask, request, jsonify, Response
from dotenv import load_dotenv
from flask_cors import CORS
import re
import json
from openai import OpenAI
import boto3
from botocore.exceptions import ClientError

from api.send_email import email_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

app.register_blueprint(email_bp)

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

try:
    client = OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully.")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
aws_region = os.environ.get("AWS_SES_REGION")
email_source = os.environ.get("EMAIL_SOURCE")

if not all([aws_access_key, aws_secret_key, aws_region, email_source]):
    print("Warning: AWS SES credentials not found in environment variables")
else:
    print("AWS SES credentials loaded successfully.")


def handle_request(request):
    """Handle requests in a serverless environment"""
    with app.request_context(request):
        path = request.path
        method = request.method

        if path.startswith('/api/suggest') and method == 'POST':
            return get_suggestions()
        
        return jsonify({"error": "Not found"}), 404

def generate_suggestions(user_question: str, prompt_text: str, question_type: str = "text", choices: list = None) -> list:
    """
    Generate three improved versions of a survey question using GPT-4.
    
    Args:
        user_question: The original survey question
        prompt_text: The user's specific request (e.g., "make this more engaging")
        question_type: The type of question (text, multiple_choice, etc.)
        choices: List of answer choices for multiple choice questions
        
    Returns:
        List of suggestion dictionaries
    """
    if not client:
        return [{"type": "error", "text": "Error: OpenAI client not initialized."}]

    print(f"Generating suggestions for question: '{user_question}' with prompt: '{prompt_text}'")
    print(f"Question type: {question_type}, Choices: {choices}")
    
    try:

        system_prompt = "You are an expert survey designer who helps improve survey questions."
        
        choices_text = ""
        if question_type in ["multiple_choice", "checkbox", "dropdown"] and choices:
            choices_text = "\nOriginal answer choices:\n" + "\n".join([f"- {choice}" for choice in choices])
        
        user_prompt = f"""I need to improve this survey question: "{user_question}"{choices_text}

The user wants me to: "{prompt_text or 'Make this question better'}"

Please provide 3 completely different improved versions of the question.
Each suggestion must follow the user's request.
"""

        if question_type in ["multiple_choice", "checkbox", "dropdown"]:
            user_prompt += """
For each suggestion, include a complete set of answer choices.
Format each suggestion as follows:

1. [Improved question]
   - [Choice 1]
   - [Choice 2]
   - [Choice 3]
   ...

2. [Improved question]
   - [Choice 1]
   - [Choice 2]
   ...

3. [Improved question]
   - [Choice 1]
   - [Choice 2]
   ...
"""
        else:
            user_prompt += """
Format your response with exactly 3 numbered suggestions:

1. [First improved question]
2. [Second improved question]
3. [Third improved question]
"""

        user_prompt += "\nDo not include any explanations or additional text."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",  # Using the latest GPT-4 model
            messages=messages,
            temperature=0.7,
            max_tokens=500  # Increased token limit to accommodate choices
        )
        
        # Extract the response text
        raw_suggestions = response.choices[0].message.content
        print(f"GPT-4 output: {raw_suggestions}")
        
        suggestions = []
        
        # Parse the response based on question type
        if question_type in ["multiple_choice", "checkbox", "dropdown"]:
            suggestion_blocks = re.split(r'\n\s*\d+\.', raw_suggestions)
            if suggestion_blocks and not suggestion_blocks[0].strip():
                suggestion_blocks = suggestion_blocks[1:]
                
            for i, block in enumerate(suggestion_blocks[:3]):
                lines = block.strip().split('\n')
                if not lines:
                    continue
                    
                question_text = lines[0].strip()
                choices = []
                
                for line in lines[1:]:
                    if line.strip().startswith('-') or line.strip().startswith('*'):
                        choice = line.strip().lstrip('-').lstrip('*').strip()
                        if choice:
                            choices.append(choice)
                
                if question_text and choices:
                    suggestions.append({
                        "type": "question_improvement",
                        "text": question_text,
                        "choices": choices
                    })
        else:
            suggestion_blocks = re.split(r'\s*\d+\.\s*', raw_suggestions)
            
            if suggestion_blocks and not suggestion_blocks[0].strip():
                suggestion_blocks = suggestion_blocks[1:]
            
            for block in suggestion_blocks[:3]:
                text = block.strip()
                text = text.strip('"').strip("'")
                
                if text and len(text.split()) > 2:
                    suggestions.append({
                        "type": "question_improvement",
                        "text": text
                    })
        if not suggestions:
            return [{"type": "error", "text": "Unable to generate suggestions. Please try a different request."}]
        
        print(f"Final suggestions: {suggestions}")
        return suggestions[:3]
    except Exception as e:
        print(f"Error during generation: {e}")
        return [{"type": "error", "text": f"Error generating suggestions: {str(e)}"}]

def send_survey_email(to_address, survey_id, survey_title="Survey Invitation", survey_description="", survey_link=None):
    """
    Sends an email with a unique survey link to the recipient.
    """
    try:
        if not survey_link:
            survey_link = f"https://echoboard.us/survey/{survey_id}"
        
        ses_client = boto3.client(
            'ses',
            region_name=os.getenv("AWS_SES_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        
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

# --- API Endpoint ---
@app.route('/suggest', methods=['POST'])
def get_suggestions():
    """API endpoint to receive a question and return AI suggestions."""
    if not request.json:
        return jsonify({"error": "Missing request body"}), 400
    
    # Get the question and prompt text
    user_question = request.json.get('question', '')
    prompt_text = request.json.get('promptText', '')
    question_type = request.json.get('questionType', 'text')
    choices = request.json.get('choices', [])

    if not user_question.strip():
        return jsonify({"error": "Question cannot be empty"}), 400

    print(f"Received question: {user_question}")
    print(f"Prompt text: {prompt_text}")
    print(f"Question type: {question_type}")
    print(f"Choices: {choices}")

    suggestions = generate_suggestions(user_question, prompt_text, question_type, choices)
    
    return jsonify({"suggestions": suggestions})

@app.route('/api/send-survey-email', methods=['POST'])
def send_survey_email_handler():
    """API endpoint to send survey emails to multiple recipients."""
    if not request.json:
        return jsonify({"status": "error", "message": "Missing request body"}), 400
    
    emails = request.json.get('emails', [])
    survey_id = request.json.get('survey_id')
    survey_title = request.json.get('survey_title', "Survey Invitation")
    survey_description = request.json.get('survey_description', "")
    survey_link = request.json.get('survey_link')
    
    if not emails or not survey_id:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    results = []
    success_count = 0
    error_count = 0
    
    for email in emails:
        result = send_survey_email(email, survey_id, survey_title, survey_description, survey_link)
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

@app.route('/api/test-send-survey-email', methods=['POST'])
def test_send_survey_email():
    """API endpoint to test sending a survey email."""
    data = request.json
    to_address = data.get('to_address')
    survey_id = data.get('survey_id')
    survey_title = data.get('survey_title', "Test Survey")
    survey_description = data.get('survey_description', "This is a test survey")
    survey_link = data.get('survey_link')

    if not to_address or not survey_id:
        return jsonify({"error": "Missing required fields"}), 400

    response = send_survey_email(to_address, survey_id, survey_title, survey_description, survey_link)
    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
else:
    app.debug = False
# empty commit