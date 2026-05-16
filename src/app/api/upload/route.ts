import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.IMGBB_API;

    if (!apiKey) {
      console.error("IMGBB_API key is not configured in .env.local");
      return NextResponse.json(
        { error: "Image upload service is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are accepted." },
        { status: 400 }
      );
    }

    // Validate file size (max 32MB — imgBB limit)
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be less than 32MB." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Upload to imgBB
    const imgbbForm = new FormData();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", base64);
    imgbbForm.append("name", file.name.replace(/\.[^.]+$/, "")); // strip extension for name

    const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    });

    if (!imgbbResponse.ok) {
      const errorText = await imgbbResponse.text();
      console.error("imgBB upload failed:", errorText);
      return NextResponse.json(
        { error: "Failed to upload image to hosting service." },
        { status: 502 }
      );
    }

    const result = await imgbbResponse.json();

    if (!result.success) {
      console.error("imgBB returned error:", result);
      return NextResponse.json(
        { error: "Image hosting service returned an error." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: result.data.display_url,
      thumb: result.data.thumb?.url || result.data.display_url,
      deleteUrl: result.data.delete_url,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload." },
      { status: 500 }
    );
  }
}
