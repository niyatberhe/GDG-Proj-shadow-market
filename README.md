# Shadow Market — Student Project

A small demo webapp for learning Express, MongoDB and simple frontend JavaScript. It provides a tiny marketplace UI and a minimal authentication flow.
Made to solve the problem of navigating the traffic of Telegram product ads and make finding products needed easier.

## Quick start (for students)

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` file (do not commit it) with at least:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=some-secret-for-jwt
```

3. Run the app:

```bash
node server.js
```

4. Open a browser to `http://localhost:3000/`.

If you want to quickly access the dashboard during development, set a token in the browser console:

```javascript
localStorage.setItem('token', 'dev-token');
localStorage.setItem('userId', 'dev');
location.reload();
```

## What’s in the repo

- `server.js` — backend (Express) and API routes
- `public/` — frontend files (`index.html`, `intro.html`, JS and CSS)
- `models/` — Mongoose models
- `.gitignore` — files and folders excluded from Git

## Notes for deployment

- Keep secrets out of the repo. Use environment variables in your host (e.g. Vercel). Do not commit `.env`.
- For easy Vercel deployment, you can deploy `public/` as a static site and host the backend separately, or convert API routes into serverless functions under `/api`.

---
