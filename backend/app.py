from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ Missing GEMINI_API_KEY in .env file")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("models/gemini-2.5-pro")


from flask import render_template

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return render_template("index.html")

HISTORY_FILE = "chat_history.json"

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(history):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message")
    instruction = "Please answer in 6 to 7 short lines only."
    prompt = f"{instruction} {user_input}"
    history = load_history()
    try:
        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(prompt)
        reply = response.text.strip()
        history.append({"user": user_input, "bot": reply})
        save_history(history)
        return jsonify({"reply": reply})
    except Exception as e:
        print("❌ Gemini ERROR:", e)
        return jsonify({"reply": f"❌ Gemini ERROR: {str(e)}"}), 500

@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(load_history())

@app.route("/delete", methods=["POST"])
def clear_history():
    data = request.get_json(silent=True)
    history = load_history()
    if data and "index" in data:
        idx = data["index"]
        if 0 <= idx < len(history):
            history.pop(idx)
            save_history(history)
            return jsonify({"status": "Item deleted"})
        else:
            return jsonify({"status": "Invalid index"}), 400
    else:
        save_history([])
        return jsonify({"status": "History cleared"})

if __name__ == "__main__":
    app.run(debug=True)