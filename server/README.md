# Helios Email Server

This backend server enables email functionality for web browser users of Helios.

> **Note:** For Vercel deployments, use the serverless function in `/api/send-email.js` instead. This Express server is only needed for local development or if deploying to a traditional Node.js hosting platform.

## Setup

1. Install dependencies (from the root directory):
```bash
npm install
```

2. Configure environment variables in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Helios <your-email@gmail.com>"
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Running the Server

### For Web Development
Run both the frontend and backend server:
```bash
npm run start:web
```

This will start:
- Vite dev server on port 5173  
- Email API server on port 3001

### Backend Only
To run just the email server:
```bash
npm run server
```

## API Endpoints

### POST /api/send-email
Send an email via SMTP.

**Request Body:**
```json
{
  "toEmail": "recipient@example.com",
  "subject": "Email Subject",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /health
Check server and SMTP configuration status.

**Response:**
```json
{
  "ok": true,
  "smtp_configured": true
}
```

### Option 1: Vercel (Recommended)
Use the serverless function approach - see [DEPLOYMENT.md](../DEPLOYMENT.md)

### Option 2: Traditional Backend
For production, you'll need to:
1. Deploy this server to a hosting platform (Heroku, Railway, Render
For production, you'll need to:
1. Deploy this server to a hosting platform (Heroku, Railway, Vercel, etc.)
2. Update `VITE_EMAIL_API_URL` in your `.env` to point to your deployed server
3. Configure `CORS_ORIGIN` to match your production frontend URL
4. Use environment variables for sensitive SMTP credentials
