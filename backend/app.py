import os
from flask import Flask, request, jsonify, Response
from dotenv import load_dotenv
from flask_cors import CORS
import re
import json
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Check for API key
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# Initialize OpenAI client
try:
    client = OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully.")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

# Add this function to handle serverless requests
def handle_request(request):
    """Handle requests in a serverless environment"""
    with app.request_context(request):
        # Get the path and method
        path = request.path
        method = request.method

        # Route the request to the appropriate endpoint
        if path.startswith('/api/suggest') and method == 'POST':
            return get_suggestions()
        
        # Add more routes as needed
        
        # Default response for unmatched routes
        return jsonify({"error": "Not found"}), 404

# --- Helper Function ---
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
        # Prepare the system prompt based on question type
        system_prompt = "You are an expert survey designer who helps improve survey questions."
        
        # Prepare the user prompt based on question type
        choices_text = ""
        if question_type in ["multiple_choice", "checkbox", "dropdown"] and choices:
            choices_text = "\nOriginal answer choices:\n" + "\n".join([f"- {choice}" for choice in choices])
        
        user_prompt = f"""I need to improve this survey question: "{user_question}"{choices_text}

The user wants me to: "{prompt_text or 'Make this question better'}"

Please provide 3 completely different improved versions of the question.
Each suggestion must follow the user's request.
"""

        # Add specific instructions based on question type
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

        # Create the messages for GPT-4
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
            # Split by numbered items (1., 2., 3.)
            suggestion_blocks = re.split(r'\n\s*\d+\.', raw_suggestions)
            # Remove empty first element if it exists
            if suggestion_blocks and not suggestion_blocks[0].strip():
                suggestion_blocks = suggestion_blocks[1:]
                
            for i, block in enumerate(suggestion_blocks[:3]):  # Limit to 3 suggestions
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
            # For text questions, use a better approach to extract numbered suggestions
            # First try to split by numbered items
            suggestion_blocks = re.split(r'\s*\d+\.\s*', raw_suggestions)
            
            # Remove empty first element if it exists
            if suggestion_blocks and not suggestion_blocks[0].strip():
                suggestion_blocks = suggestion_blocks[1:]
            
            # Process each block
            for block in suggestion_blocks[:3]:  # Limit to 3 suggestions
                text = block.strip()
                # Remove any quotation marks that might be present
                text = text.strip('"').strip("'")
                
                if text and len(text.split()) > 2:  # Ensure it's not too short
                    suggestions.append({
                        "type": "question_improvement",
                        "text": text
                    })
        
        # If we somehow don't get any suggestions, generate a generic error
        if not suggestions:
            return [{"type": "error", "text": "Unable to generate suggestions. Please try a different request."}]
        
        print(f"Final suggestions: {suggestions}")
        return suggestions[:3]  # Return at most 3 suggestions
    except Exception as e:
        print(f"Error during generation: {e}")
        return [{"type": "error", "text": f"Error generating suggestions: {str(e)}"}]

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

    # Generate suggestions
    suggestions = generate_suggestions(user_question, prompt_text, question_type, choices)
    
    # Return the suggestions as JSON
    return jsonify({"suggestions": suggestions})

# For local development
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
else:
    # For Vercel deployment
    app.debug = False
