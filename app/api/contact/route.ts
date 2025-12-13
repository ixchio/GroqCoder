/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, getClientIp } from "@/lib/rate-limit";

// Contact form endpoint - sends email notification
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 messages per hour
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 3, 60 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: `Too many messages. Try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { subject, message, email, name } = body;

    // Validate
    if (!subject || !message) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Subject and message are required" },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { ok: false, error: "Subject too long" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "Message too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Store the message (you could also use a database)
    const contactData = {
      subject: subject.trim(),
      message: message.trim(),
      email: email || session?.user?.email || "anonymous",
      name: name || session?.user?.name || "Anonymous",
      userId: session?.user?.id || null,
      timestamp: new Date().toISOString(),
      ip: ip,
    };

    // Log the contact (in production, you'd want to store this in a database)
    console.log("📧 New contact message:", contactData);

    // Send email using a webhook or email service
    // For now, we'll use a simple approach - you can integrate with services like:
    // - Resend
    // - SendGrid
    // - Mailgun
    // - Or a webhook to Zapier/Make/n8n
    
    const emailTo = process.env.CONTACT_EMAIL || "amankumarpandeyin@gmail.com";
    
    // Try to send via webhook if configured
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: emailTo,
            ...contactData,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook failed:", webhookError);
        // Continue anyway - the message is logged
      }
    }

    // If Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Groq Coder <noreply@groqcoder.dev>",
            to: [emailTo],
            subject: `[Groq Coder Help] ${contactData.subject}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ec4899;">New Help Message</h2>
                <p><strong>From:</strong> ${contactData.name} (${contactData.email})</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                  <p style="white-space: pre-wrap;">${contactData.message}</p>
                </div>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 12px;">
                  Sent at: ${contactData.timestamp}<br/>
                  User ID: ${contactData.userId || "Not logged in"}
                </p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Resend email failed:", emailError);
        // Continue anyway - the message is logged
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Message sent successfully",
    });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
