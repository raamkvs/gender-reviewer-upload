import { put } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  if (!blobToken) {
    return NextResponse.json({ error: "Vercel Blob not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const chatIdTopic = (formData.get("chat_id_topic") as string | null)?.trim();
  if (!chatIdTopic) {
    return NextResponse.json({ error: "chat_id_topic is required" }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const uploaded: { filename: string; blob_url: string }[] = [];
  const errors: { filename: string; error: string }[] = [];

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      errors.push({ filename: file.name, error: "Only PDF files are accepted" });
      continue;
    }

    try {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
        token: blobToken,
      });

      // Record in Supabase uploads table with processed=false
      const { error: dbError } = await supabase.from("uploads").insert({
        chat_id_topic: chatIdTopic,
        blob_url: blob.url,
        filename: file.name,
        processed: false,
      });

      if (dbError) {
        errors.push({ filename: file.name, error: dbError.message });
        continue;
      }

      uploaded.push({ filename: file.name, blob_url: blob.url });
    } catch (err) {
      errors.push({ filename: file.name, error: String(err) });
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: "All uploads failed", errors },
      { status: 500 }
    );
  }

  return NextResponse.json({ uploaded: uploaded.length, files: uploaded, errors });
}
