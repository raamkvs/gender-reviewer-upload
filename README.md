# Gender Reviewer — Upload Page

A standalone Next.js app (deployed to Vercel) that lets users upload PDF documents
for a specific Gender Reviewer session (`chat_id_topic`).

Uploaded files are stored in Vercel Blob and recorded in the Supabase `uploads` table
with `processed=false`. The chatbot then triggers a `run=rerun` call to the Railway
pipeline to process them.

## Local Development

```bash
npm install
cp .env.local.example .env.local   # fill in SUPABASE_URL, SUPABASE_KEY, BLOB_READ_WRITE_TOKEN
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

1. Push this folder to a GitHub repo (or use Vercel's monorepo support to point to `upload-page/`)
2. In Vercel → New Project → select the repo
3. Set Root Directory to `upload-page/`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `BLOB_READ_WRITE_TOKEN`
5. Deploy

## How It Works

1. **GET /api/chat-ids** — reads `pipeline_results` from Supabase and returns all existing `chat_id_topic` values so users can pick from a dropdown
2. **POST /api/upload** — accepts `chat_id_topic` + one or more PDF files, uploads to Vercel Blob, and inserts a row into `uploads` (with `processed=false`)
3. After uploading, users tell their chatbot to rerun — the chatbot calls `POST /api/pipeline/analyze` with `run=rerun` on the Railway pipeline, which picks up the new uploads
