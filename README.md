Setup
1. Clone the repository
git clone <REPO_URL>
cd medical-ocr-web-poc

2. Install dependencies

From the project root:

npm install


This installs frontend, backend, and development dependencies.

3. Create environment variables

Create a file named .env in the project root:

GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
PORT=5055

Do not commit this file to git.

4. Start the app (frontend + backend)

From the project root:

npm run dev:all


This starts:

Frontend at http://localhost:5173

Backend API at http://localhost:5055

5. Verify backend is running

Open in a browser:

http://localhost:5055/health


Expected response:

{ "ok": true }

6. Use the app

Open http://localhost:5173

Upload a prescription image

Click Run OCR

Click Summarize

View the patient-friendly explanation
