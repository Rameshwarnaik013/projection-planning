# Projection Planning

A web app for **Capacity Planning** and **Bottleneck Analysis** across factories
(Indore, Bihar, Kundli, UD, South). Users register/log in with email, pick a
factory, and submit entries that are written straight to a **Google Sheet**.
Date and the logged-in user's email are recorded automatically on every entry.

> **Capacity basis:** Available Hr = **18** (2 combined shifts at maximum company
> efficiency). Capacity is entered on this basis; Current Utilization % is
> auto-calculated as `Projection ÷ Capacity` (e.g. 2,500,000 ÷ 2,000,000 = 125%).

## Where data goes (all in Google Sheets)

The app creates and uses three tabs in your Sheet automatically:

| Tab | Holds |
|-----|-------|
| `Users` | email, hashed password, name, createdAt |
| `CapacityPlanning` | timestamp, userEmail, factory, month, availableHr, capacity, projection, utilization, peakUtil, bottleneckArea, expandableCapacity |
| `BottleneckAnalysis` | timestamp, userEmail, factory, availableHr, process, currentCapacity, requiredCapacity, gap, actionRequired |

## One-time setup

### 1. Create a Google Service Account (works with ANY Google account's Sheet)
1. Go to https://console.cloud.google.com/ → create/select a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
4. Open the service account → **Keys → Add key → JSON**. A JSON file downloads.
   It contains `client_email` and `private_key`.

### 2. Create the Sheet and share it
1. Create a new Google Sheet on whatever email you want (it does NOT need Claude Code).
2. Click **Share** and add the service account's `client_email` as **Editor**.
3. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/THIS_PART/edit`.

### 3. Configure environment
Copy `.env.local.example` to `.env.local` and fill in:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from JSON>
GOOGLE_PRIVATE_KEY="<private_key from JSON, keep the \n>"
GOOGLE_SHEET_ID=<the Sheet ID>
JWT_SECRET=<long random string>
```

Generate a JWT secret:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000 → Register → pick a factory → fill a form.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new.
3. Add the four env vars (same as `.env.local`) in **Project Settings → Environment Variables**.
   For `GOOGLE_PRIVATE_KEY`, paste the value with literal `\n` sequences exactly as in the JSON.
4. Deploy. Your team can register and use it from anywhere.

## Notes
- Passwords are hashed with bcrypt before storage; sessions are signed JWTs in an httpOnly cookie.
- To change factories or processes, edit `FACTORIES` in `src/app/factories/page.tsx`
  and `PROCESSES` in `src/app/_components/BottleneckForm.tsx`.
