# EcoAudit – Community Waste Logger

A waste logging application where community members log waste entries with GPS-verified locations. The data feeds into a dashboard with analytics, category breakdowns, and geographic waste concentration mapping. Users and admins have different levels of access, and all data can be exported as Excel or PDF.

---

## Project Overview

The application does three things:

1. **Waste logging with location proof** — Each entry captures the category, weight, and GPS coordinates at submission time. I decided early on that location should be verified *before* the user can submit, not after.

2. **Server-side analytics** — The dashboard shows totals, category breakdowns (as a donut chart), and identifies the geographic area with the highest waste concentration. All of this is computed in SQL on the backend. I initially tried computing analytics in Python, but that approach doesn't scale.

3. **Data export** — Both Excel and PDF exports are generated entirely in memory on the server and streamed to the client. No temp files.

---

## Architecture Overview

```
User (Browser)
     │
     ▼
Next.js Frontend (React, Tailwind CSS)
     │
     │  Axios + Supabase JWT
     ▼
FastAPI REST API
     │
     ├── Auth: Supabase token verification
     ├── Validation: Pydantic + DB check constraints
     ├── Rate Limiting: slowapi
     │
     ▼
Supabase PostgreSQL
     │
     ▼
Dashboard / Exports
```

The frontend is a Next.js app that handles routing and UI. Authentication goes through Supabase — the JS SDK handles signup/login on the client, and the backend validates the JWT on every API call by calling `supabase.auth.get_user(token)`. I didn't write my own JWT implementation. Supabase handles token signing and verification, which removes a whole class of security concerns.

On the backend, FastAPI receives every request, validates it through Pydantic schemas, and talks to a PostgreSQL database through SQLAlchemy. I chose FastAPI specifically because Pydantic validation is built in — you define the expected shape and constraints, and invalid requests get rejected automatically with clear error messages.

The database is Supabase-hosted PostgreSQL. I added check constraints at the DB level as a second layer of defense. If a future code change accidentally bypasses Pydantic, the database itself still rejects bad data.

---

## Complete Data Flow

What actually happens when someone submits a waste log:

```
User fills in category + weight
     │
     ▼
Clicks "Get Current Location"
     │
     ▼
Browser prompts for geolocation permission
     │
     ▼
OS queries GPS / WiFi / Cell Towers
     │
     ▼
Coordinates + accuracy returned
     │
     ▼
UI shows "Verified" → Submit button enables
     │
     ▼
User clicks Submit
     │
     ▼
Axios interceptor attaches JWT
     │
     ▼
POST /logs hits FastAPI
     │
     ▼
Rate limiter: 5 req/min per IP
     │
     ▼
JWT validated against Supabase
     │
     ▼
Profile fetched (or created if first request)
     │
     ▼
Pydantic validates: enum category, weight > 0, valid coordinates
     │
     ▼
SQLAlchemy inserts into waste_logs
     │
     ▼
DB CHECK constraints: weight > 0, lat ∈ [-90,90], lon ∈ [-180,180]
     │
     ▼
201 Created → frontend confirms success
```

The double validation (Pydantic + database constraints) is intentional. It feels redundant, and when I first set it up I thought the same thing. But the reasoning is simple — Pydantic gives good error messages for the user, and the database constraints act as a safety net for the developer. If someone refactors the schemas and accidentally removes a constraint, the DB still rejects invalid data.

---

## How Browser Geolocation Actually Works

This was one of the more interesting things I had to understand while building the project, so it's worth explaining properly.

```
JavaScript calls navigator.geolocation.getCurrentPosition()
     │
     ▼
Browser (not the website) handles this
     │
     ▼
Browser asks user for permission
     │
     ▼
If granted → Browser asks the OS for position
     │
     ▼
OS queries available hardware: GPS / WiFi / Cell Towers
     │
     ▼
Position calculated (latitude, longitude, accuracy)
     │
     ▼
Returned to Browser → Returned to JavaScript
```

A key thing I didn't initially understand: **the website never talks to GPS hardware directly.** JavaScript can only *ask* the browser to get a position fix. The browser is the gatekeeper — it prompts the user, queries the OS, and returns the result. The website has no way to bypass this.

**Why permission is required**: The W3C Geolocation API spec mandates user consent. Without it, any website could silently track your physical location. The browser enforces this regardless of what the website code requests.

**Laptops vs phones**: Most laptops don't have GPS chips. They estimate position by sending nearby WiFi access point signals to a positioning service (like Google's), which triangulates an approximate location. That's why laptop accuracy is typically 20–100m while phones with GPS achieve 3–10m. I store the accuracy value specifically so that low-quality readings can be identified later.

**Why I don't allow manual coordinate entry**: If someone could type in coordinates, the entire location verification system becomes pointless. They could enter any location from Google Maps. The browser Geolocation API ensures coordinates come from the actual device position at submission time.

---

## Tech Stack

| Technology | What It Does | Why I Chose It |
|---|---|---|
| **Next.js 14** | Frontend | File-based routing with the App Router kept page organization clean. SSR for the login page meant it loads fast even before JS hydrates. |
| **FastAPI** | Backend API | I first considered Flask, but FastAPI's native Pydantic integration meant I could define request validation declaratively instead of writing manual checks everywhere. The auto-generated docs (`/docs`) were also helpful during development. |
| **Supabase** | Auth + Database | Managed PostgreSQL with built-in authentication. Saved me from implementing password hashing, JWT signing, and session management. The free tier was sufficient for this project. |
| **SQLAlchemy** | ORM | Maps Python classes to tables. I used it for most queries, but for the highest-area analytics I needed `func.round()` and `func.cast()` — SQLAlchemy handled that without dropping to raw SQL. |
| **Pydantic** | Request validation | The `WasteCategory` enum restricts categories to exactly 7 values. Field constraints like `gt=0` and `le=1000` on weight catch bad input before it reaches any business logic. |
| **Tailwind CSS** | Styling | Utility classes co-located with components. No context switching to separate CSS files. Dark mode was straightforward with the `dark:` prefix. |
| **Axios** | HTTP client | The interceptor pattern let me attach the JWT to every request automatically. A response interceptor also unwraps the `SuccessResponse` wrapper so components get clean data. |
| **Recharts** | Charts | Renders the donut chart for category breakdown. It's React-native and lightweight — no extra charting runtime needed. |
| **Leaflet** | Maps | Renders the highest waste area on a map. Open source, no API key, works with OpenStreetMap tiles. |
| **ReportLab** | PDF export | Generates formatted PDF tables server-side from query results. |
| **openpyxl** | Excel export | Writes `.xlsx` files in memory. I added cell sanitization (prefixing `=`, `+`, `-`, `@` with quotes) to prevent CSV injection. |
| **slowapi** | Rate limiting | 5 req/min for writes, 30 req/min for reads. Prevents abuse without blocking normal usage. |

---

## Folder Structure

### Backend

| Directory | What's In It |
|---|---|
| `routes/` | Endpoint handlers — `logs.py` for CRUD, `analytics.py` for aggregations, `export.py` for file downloads. |
| `models/` | SQLAlchemy models. `Profile` for users (synced from Supabase auth), `WasteLog` with check constraints on every numeric field. |
| `schemas/` | Pydantic models. The `WasteCategory` enum, field constraints, and the generic `SuccessResponse[T]` wrapper that standardizes all API responses. |
| `database/` | Engine and session config. Handles both SQLite (dev) and PostgreSQL (prod) based on `DATABASE_URL`. |
| `dependencies/` | The `get_current_user` dependency — validates the Supabase JWT and returns a `Profile` record, creating one automatically on first login. |
| `services/` | Business logic. `export_service.py` generates Excel and PDF files with cell sanitization and timezone conversion. |

### Frontend

| Directory | What's In It |
|---|---|
| `app/` | Next.js pages. `dashboard/`, `login/`, `settings/` — each with its own `page.tsx`. |
| `components/` | `WasteForm`, `DashboardStats`, `WasteTable`, `Sidebar`, `LocationCard`, `HighestWasteMap`, etc. |
| `services/` | Axios client setup with JWT interceptor and response unwrapping. Export and delete helpers. |
| `lib/` | Supabase client init and shadcn/ui utils. |

---

## Database Design

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36), PK | Matches the UUID from Supabase Auth |
| `name` | VARCHAR(100) | Optional |
| `email` | VARCHAR(255), Unique, Indexed | Indexed for admin log attribution lookups |
| `role` | VARCHAR(20), Default "user" | "user" or "admin" — controls data access scope |
| `created_at` | TIMESTAMP WITH TZ | Auto-set |

### `waste_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36), PK | UUID generated at insertion |
| `category` | VARCHAR(50), Indexed | Indexed because `GROUP BY category` runs on every analytics request |
| `weight` | FLOAT, CHECK > 0 | Kilograms |
| `latitude` | FLOAT, CHECK [-90, 90] | From browser geolocation |
| `longitude` | FLOAT, CHECK [-180, 180] | From browser geolocation |
| `accuracy` | FLOAT, CHECK > 0 | GPS accuracy radius in meters |
| `created_at` | TIMESTAMP WITH TZ | Used for "Latest Entry" and sorting |
| `user_id` | VARCHAR(36), FK → profiles.id | Associates log with a user |

### Why PostgreSQL

I initially considered MongoDB because of the flexibility. But once I started building the analytics dashboard, I realized every card required SQL aggregation — `SUM(weight)`, `GROUP BY category`, `COUNT(*)`, `MAX(created_at)`. These are native SQL operations. In MongoDB, I would've needed aggregation pipelines for each of these, which adds complexity without giving me anything useful in return. The schema is well-defined and unlikely to change, so schemaless storage had no real upside.

---

## Dashboard Analytics — How Each Card Works

Everything is computed in SQL. The frontend just displays pre-calculated values.

**Total Waste**: `SUM(weight)` across all of the user's logs. Admins see the sum across all users.

**Total Entries**: `COUNT(*)`. Row count.

**Category Breakdown**: `GROUP BY category` with `SUM(weight)` per group. The frontend renders this as a donut chart using Recharts. Each slice is proportional to its weight in the total.

**Most Logged Category**: Same `GROUP BY` result, sorted descending. First row wins.

**Latest Entry**: `MAX(created_at)`. The frontend converts this to relative time ("6h ago") using `date-fns`.

**Highest Waste Area**: This one was the most interesting to figure out. I needed geographic clustering without PostGIS. The approach I settled on: round latitude and longitude to 2 decimal places, which creates grid cells of roughly 1.1 km². Then group by the rounded coordinates, sum weight per cell, and return the heaviest one.

```sql
SELECT ROUND(latitude, 2), ROUND(longitude, 2),
       SUM(weight) as total_weight,
       COUNT(*) as entry_count
FROM waste_logs
GROUP BY ROUND(latitude, 2), ROUND(longitude, 2)
ORDER BY total_weight DESC
LIMIT 1
```

It's a simple approximation, but it works well for the scale of this project.

---

## Export System

### Excel (openpyxl)

```
DB query → Python list → openpyxl Workbook (in memory) → BytesIO → StreamingResponse
```

Each log becomes a row. I added a `sanitize_cell()` function that prefixes cell values starting with `=`, `+`, `-`, or `@` with a single quote. Without this, a malicious category name like `=CMD("calc")` would execute as a formula when the file is opened in Excel. It's a known attack vector — CSV injection.

Timestamps are stored in UTC but converted to IST (`Asia/Kolkata`) in the export using `zoneinfo`. I handle this server-side rather than relying on the client's timezone so the output is consistent regardless of where the download is triggered from.

### PDF (ReportLab)

```
DB query → Python list → ReportLab Table → SimpleDocTemplate → BytesIO → StreamingResponse
```

The PDF gets a title, a styled table (grey headers, centered alignment, grid lines), and category/weight/timestamp columns. Both export functions generate files entirely in memory using `BytesIO` — no temp files on disk, no cleanup.

I chose `openpyxl` because it's the standard for `.xlsx` in Python and doesn't require Excel installed. `ReportLab` is the most mature open-source option for PDF generation and handles table layouts without much fuss.

---

## Security Considerations

I tried to think about security not as a checklist but as understanding *why* each protection matters.

**Why backend validation exists even though the frontend validates too**: During testing, I used Postman to send requests directly to the API, bypassing the frontend entirely. It immediately became clear that frontend validation is cosmetic — anyone with curl can send a request with weight = -50 or latitude = 999. Pydantic on the backend catches this at the API boundary.

**Why the database has CHECK constraints on top of Pydantic**: If someone modifies the Pydantic schema during a refactor and accidentally removes the weight constraint, the `CHECK weight > 0` in PostgreSQL still rejects bad data. It's redundant by design.

**SQL injection**: SQLAlchemy parameterizes queries automatically. I never construct SQL strings with user input.

**XSS and security headers**: A middleware adds `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and HSTS to every response. These are standard protections — CSP prevents inline script execution, X-Frame-Options prevents clickjacking, nosniff prevents MIME type confusion.

**Rate limiting**: Log creation is limited to 5/minute per IP, exports to 5/minute, reads to 30/minute. Without this, someone could spam the log endpoint and flood the database, or repeatedly trigger exports to burn server resources.

**CORS**: Only the frontend URL is whitelisted. Credentials are allowed for authenticated requests.

**Production hardening**: Swagger docs are disabled unless `DEBUG=True`. There's no reason to expose your API structure in production.

**Request size limiting**: A middleware rejects requests larger than 1 MB. Waste logs are small JSON payloads — there's no legitimate reason for a megabyte-sized request.

---

## Engineering Decisions

| What I Decided | Why |
|---|---|
| PostgreSQL over MongoDB | Analytics need `SUM`, `GROUP BY`, `COUNT`, `MAX`. These are native SQL. MongoDB would require aggregation pipelines for the same thing. |
| FastAPI over Flask | Pydantic validation is built in. I define the schema once and get both validation and API docs. Flask would've needed separate validation logic. |
| Browser geolocation, not manual input | Manual coordinates defeat the purpose. If you can type them in, you can fake them. Browser geolocation ties the reading to the physical device. |
| Submit disabled until location verified | I first had location as optional and planned to request it on submit. During testing, users filled out the entire form, hit submit, then got a location prompt — confusing. Moving verification before submission made the flow obvious. |
| Validation in both Pydantic and DB | Pydantic gives good error messages. DB constraints are a safety net for future code changes. The redundancy is intentional. |
| Analytics in SQL, not Python | Early versions computed everything in Python loops. It worked, but it was slow and verbose. Moving to SQL aggregates cut both the code and the computation time. |
| Exports as streaming responses | Generates files in `BytesIO` and streams them. No temp files, no disk I/O, no cleanup logic. |
| Profile auto-creation | The `get_current_user` dependency creates a profile if one doesn't exist. I didn't want a separate "complete your profile" step after Supabase signup. |
| Rounded coordinates for area grouping | `ROUND(lat, 2)` creates ~1 km² cells. Simple approximation that avoids PostGIS while still providing useful geographic clustering. |
| Store GPS accuracy | A log with ±500m accuracy is very different from ±10m. Storing this lets you assess data quality per entry. |

---

## Trade-offs

**PostgreSQL vs MongoDB**: I considered MongoDB early on because the document model seemed flexible. But once I mapped out the analytics dashboard, every card needed aggregation queries. SQL handles these natively. MongoDB can do it through aggregation pipelines, but the added complexity wasn't justified when the schema is stable and well-defined.

**Location timing**: My first implementation requested location when the user clicked Submit. In practice, this was a bad experience — users filled out the form, clicked submit, got a browser permission prompt, and sometimes denied it out of surprise. I moved location verification to an explicit step before submission. The submit button stays disabled until location is confirmed. More upfront friction, but much clearer workflow.

**Coordinate rounding for area detection**: I needed geographic clustering but didn't want to add PostGIS as a dependency. Rounding lat/lon to 2 decimal places creates grid cells of about 1.1 km², which is good enough for identifying general areas. The trade-off is precision — two waste entries 500m apart might fall in different cells. For a community waste logger, that level of precision felt acceptable.

**Dual validation**: Having both Pydantic and database constraints means validation logic exists in two places. Keeping them in sync is a maintenance cost. But the alternative — relying on a single layer — means a bug in one place lets bad data through. I decided the maintenance cost was worth the safety.

---

## Challenges During Development

**Geolocation permission UX**: The browser geolocation prompt appears without any styling control — you can't customize it. If a user hits "Block," there's no way to re-trigger it from JavaScript. The only recovery is for the user to manually reset location permissions in browser settings. I handle this by showing a clear error message with instructions, but it's an inherently awkward situation that the Geolocation API doesn't solve well.

**Leaflet and SSR**: Leaflet accesses `window` and `document` on import, which don't exist during Next.js server-side rendering. I had to use `next/dynamic` with `ssr: false` to lazy-load every map component. This was a runtime error that only appeared in production builds — development worked fine because it doesn't SSR by default.

**Timezone conversion in exports**: Timestamps are stored as UTC in the database. I initially displayed them as-is in exports, which made times look wrong for users in IST. I added server-side conversion using `zoneinfo` so that the exported files always show IST times, regardless of where the request originates.

**Deciding what analytics to compute server-side vs client-side**: I first had the frontend fetch all logs and compute totals in JavaScript. It worked for 10 entries. It would not work for 10,000. Moving aggregation to SQL was the right call — `SUM` and `GROUP BY` are what databases are optimized for.

**CSV injection in exports**: I didn't initially think about this. A category value like `=HYPERLINK("http://evil.com", "click")` would execute as an Excel formula. The `sanitize_cell()` function prefixes any cell starting with `=`, `+`, `-`, or `@` with a quote character to neutralize this.

**Admin data isolation**: Every route that queries `waste_logs` checks the user's role. Standard users get `WHERE user_id = ?` appended. Admins skip the filter. I enforce this in the backend, not the frontend, because frontend checks can be bypassed by anyone who opens DevTools.

---

## API Documentation

### `POST /logs` — Create a waste log
- **Rate limit**: 5/minute
- **Auth**: Bearer JWT required
- **Body**:
  ```json
  {
    "category": "Plastic",
    "weight": 2.5,
    "latitude": 13.0475,
    "longitude": 80.2241,
    "accuracy": 12.5
  }
  ```
- **Success**: `201` — `{ success: true, data: { id, category, weight, ... } }`
- **Errors**: `401` invalid token, `422` validation error, `429` rate limited

### `GET /logs` — Fetch waste logs
- **Rate limit**: 30/minute
- **Params**: `skip`, `limit` (max 100), `sort_by` (date|weight), `order` (asc|desc)
- **Behaviour**: Users see their own logs. Admins see all.

### `DELETE /logs/{log_id}` — Delete a log
- **Rate limit**: 30/minute
- **Errors**: `404` not found, `403` not your log (unless admin)

### `GET /analytics` — Dashboard statistics
- **Rate limit**: 30/minute
- **Returns**: `{ total_waste, total_entries, category_totals, most_logged_category, latest_entry }`

### `GET /analytics/highest-area` — Geographic hotspot
- **Rate limit**: 30/minute
- **Returns**: `{ latitude, longitude, total_weight, entry_count }` or `null`

### `GET /export/excel` — Download .xlsx
- **Rate limit**: 5/minute
- **Returns**: Binary file stream

### `GET /export/pdf` — Download PDF report
- **Rate limit**: 5/minute
- **Returns**: Binary file stream

---

## Performance Considerations

**Pagination**: `GET /logs` accepts `skip` and `limit`. The frontend pages through 100 logs at a time instead of loading everything.

**SQL aggregation**: Dashboard analytics use `SUM`, `COUNT`, `MAX`, and `GROUP BY` inside the database. I don't fetch rows to Python and loop over them.

**Indexing**: `category` is indexed because every analytics request groups by it. `email` on `profiles` is indexed and unique for fast admin lookups.

**Parallel API calls**: The dashboard fires three requests simultaneously with `Promise.all()` — analytics, highest area, and logs. Total load time = slowest single request, not the sum of all three.

**Lazy-loaded maps**: Leaflet components use `next/dynamic` with `ssr: false` to avoid hydration errors and reduce initial bundle size.

**In-memory exports**: Files are generated in `BytesIO` and streamed. No disk writes.

---

## Future Improvements

- **Reverse geocoding** — Show human-readable addresses instead of raw coordinates. An API like Nominatim could convert lat/lon to "Kodambakkam, Chennai" in the waste table and exports.
- **Heatmap** — Overlay waste density on a full map using Leaflet's heatmap plugin. Would give a better visual than a single "highest area" pin.
- **Image upload** — Let users attach photos of waste. Would need Supabase Storage or S3 and a separate upload endpoint with file validation.
- **Offline support** — Service workers could cache the submission form and queue entries for when connectivity resumes. Useful for fieldwork in low-signal areas.
- **Time-series analytics** — "How has plastic waste changed week over week?" Needs `GROUP BY date_trunc('week', created_at)` and a line chart.
- **Better admin dashboard** — Currently admins just see all data. A dedicated admin view with user management, bulk delete, and flagging would be more useful.
- **Bulk CSV upload** — Accept a CSV with multiple entries. Would need row-level validation with clear error reporting for each line.

---

## Lessons Learned

**Browser APIs shape your architecture more than you'd expect.** I assumed geolocation would be a simple function call. In reality, it's asynchronous, permission-gated, can fail silently, and returns metadata (accuracy) that you need to handle. This single API constraint shaped the entire form submission flow — the two-step verify-then-submit pattern exists because you can't get coordinates instantly.

**Never trust the frontend.** This sounds obvious in theory. In practice, I didn't fully appreciate it until I tested the API with Postman and realized I could submit logs with weight = -100 or latitude = 999 with no validation. The frontend has validation for UX, but the backend has validation for correctness. They serve different purposes.

**SQL is underrated for analytics.** My first version of the analytics endpoint fetched all logs into Python and calculated totals in a for loop. It worked. It was also slow and took 15 lines of code for something `SUM(weight)` does in one. Moving everything to SQL aggregate functions was a significant improvement in both performance and readability.

**Understanding the request lifecycle matters.** Knowing exactly what happens from the moment a user clicks Submit to the moment the database writes a row — JWT attachment, token validation, profile lookup, schema validation, ORM insertion, check constraints — made debugging much faster. When something failed, I could pinpoint which layer was responsible instead of guessing.

**Defense-in-depth feels redundant until it saves you.** Pydantic checks `weight > 0`. The database also checks `weight > 0`. During a refactor, I temporarily broke the Pydantic schema. The database constraint caught the invalid data that would have slipped through. That's when the redundancy paid for itself.

---

## Screenshots

> Screenshots are available in the `docs/` directory.

| Screen | Description |
|---|---|
| Login | Email/password auth with user/admin role tabs |
| Log Waste | Category selector, weight input, location verification button |
| Dashboard | Stat cards, donut chart, map with highest waste area, waste logs table |
| Settings | User email, role display, sign out |
| Exports | Excel and PDF download from the waste logs table |

---

## Running the Project

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project (free tier is fine)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `.env` from `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SUPABASE_API_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_URL=http://localhost:3000
DEBUG=True
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:3000`.

### Database

Tables are created automatically on backend startup via `Base.metadata.create_all()`. No manual migrations needed for initial setup.

---

## Conclusion

Building EcoAudit taught me more about system architecture than any individual technology in the stack. The interesting parts weren't the frameworks themselves — they were the decisions between them. Why SQL aggregation over Python loops. Why dual validation layers. Why browser geolocation can't be optional. Why the frontend should never be the only line of defense.

The project is fundamentally about data integrity. If the location data isn't trustworthy, the analytics are meaningless and the exports are just decorated guesses. Every architectural decision — from disabling the submit button until GPS verification to rounding coordinates for spatial grouping — was made to keep that trust intact.
