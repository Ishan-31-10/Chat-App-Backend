# Updated Chat App Backend — Campaign/Notification Additions

What's added:
- Mongoose models: Campaign, CampaignRecipient, Notification, ActionLog, AdminOTP
- Routes: /api/campaigns, /api/recipients, /api/admin
- A simple worker using Bull for send_campaign and send_notification jobs
- Dockerfile, Dockerfile.worker, docker-compose.yml
- .env.example with required variables
- package.json updated with bull, nodemailer, luxon

How to run (dev):
1. Copy .env.example to .env and adjust values.
2. Install dependencies: `npm install`
3. Start server: `npm run dev`
4. Start worker in separate terminal: `npm run worker`

Or with Docker:
`docker-compose up --build`

API Highlights (curl examples):
- Create campaign:
  curl -X POST http://localhost:5000/api/campaigns -H 'Content-Type: application/json' -d '{"title":"Test","message":"Hello","created_by":null}'

- Add recipients:
  curl -X POST http://localhost:5000/api/campaigns/<id>/recipients -H 'Content-Type: application/json' -d '{"recipients":[{"name":"Bob","email":"bob@example.com"}]}'

- Send campaign:
  curl -X POST http://localhost:5000/api/campaigns/<id>/send

- Recipient action (on notification id):
  curl -X POST http://localhost:5000/api/recipients/notifications/<notification_id>/action -H 'Content-Type: application/json' -d '{"action":"accept","actor_id":"<userId>"}'

- Admin OTP request:
  curl -X POST http://localhost:5000/api/admin/request-otp -H 'Content-Type: application/json' -d '{"identifier":"admin@example.com"}'

Notes:
- This is a best-effort integration into your existing repo. Test locally and adapt auth checks and socket emissions as needed.
- For production, hook up a real SMTP provider and secure JWT auth.
