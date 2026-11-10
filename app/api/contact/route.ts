
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Basic server-side validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please complete all fields." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Please enter a message of at least 10 characters." },
        { status: 400 }
      );
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    const fromEmail = process.env.BOOKING_FROM_EMAIL;

    if (!ownerEmail || !fromEmail || !process.env.RESEND_API_KEY) {
      console.error("Contact email environment variables are missing.");

      return NextResponse.json(
        { error: "The contact service is temporarily unavailable." },
        { status: 500 }
      );
    }

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      replyTo: email,
      subject: `Website contact message from ${name}`,
      text: `New contact form submission
      Name: ${name}
      Email: ${email}
      Message: ${message}`,
    });

    if (error) {
      console.error("Resend contact email error:", error);

      return NextResponse.json(
        { error: "Unable to send your message right now." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Message sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
