import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";
import User from "@/lib/models/user";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";
import { customerUserId } from "@/lib/auth/identity";
import { hashRecoveryToken } from "@/lib/auth/recovery-access";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

const IP_RATE_LIMIT = 5;
const EMAIL_RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderEmail, senderName, message } = body;

    if (!senderEmail || !senderName || !message) {
      return NextResponse.json(
        { error: "Email, name, and message are required" },
        { status: 400 }
      );
    }

    if (typeof senderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (typeof senderName !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const normalizedEmail = senderEmail.trim().toLowerCase();
    const normalizedInputName = normalizeString(senderName);

    if (normalizedInputName.length < 2 || normalizedInputName.length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    if (message.trim().length < 10 || message.trim().length > 2000) {
      return NextResponse.json({ error: "Message must be 10-2000 characters" }, { status: 400 });
    }

    const ip = clientIp(request);

    const ipRate = rateLimit("recovery-send-ip", ip, IP_RATE_LIMIT, RATE_WINDOW);
    const emailRate = rateLimit("recovery-send-email", normalizedEmail, EMAIL_RATE_LIMIT, RATE_WINDOW);
    if (!ipRate.ok || !emailRate.ok) {
      audit("recovery_status_rate_limited", { route: "/api/messages/recovery", ip, email: normalizedEmail });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds)) } }
      );
    }

    await connectMongoDB();

    const registeredUser = await User.findOne({ email: normalizedEmail }).select("_id name email").lean();
    if (!registeredUser) {
      return NextResponse.json(
        { message: "If this email is associated with an account, your request has been received." },
        { status: 201 }
      );
    }

    // The caller claims to be this account. Only a *proven* identity counts —
    // a signed session, or the bound visitor cookie. The raw `x-user-id`
    // header is a claim anybody can make once they know the victim's account
    // id, so it is never used as evidence: without proof this is a 401 and the
    // requester has to sign in first (which is what the form already tells
    // them to do).
    const identity = await customerUserId(request, request.headers.get("x-user-id"));
    const senderUserId = identity || "";

    if (!senderUserId) {
      return NextResponse.json(
        { error: "Please log in to send a message. This helps us verify your identity and protect your account." },
        { status: 401 }
      );
    }

    if (senderUserId !== registeredUser._id.toString()) {
      return NextResponse.json(
        { error: "The provided identity does not match the account associated with this email. Please log in with the correct account." },
        { status: 403 }
      );
    }

    const storedName = normalizeString(registeredUser.name);
    if (normalizedInputName !== storedName) {
      return NextResponse.json(
        { error: "The name you entered does not match the name on this account. Please enter the name exactly as it appears on your account." },
        { status: 403 }
      );
    }

    const recent = await Message.findOne({
      senderEmail: normalizedEmail,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (recent) {
      return NextResponse.json(
        { error: "You can only send one request per hour. Please wait before sending another." },
        { status: 429 }
      );
    }

    // One-time lookup token: only the holder of this response can read the
    // admin's reply (which contains the recovery key) later.
    const recoveryToken = crypto.randomBytes(24).toString("base64url");

    const created = await Message.create({
      type: "account-recovery",
      senderEmail: normalizedEmail,
      senderUserId: senderUserId,
      senderName: sanitize(senderName.trim()),
      message: sanitize(message.trim()),
      lookupTokenHash: hashRecoveryToken(recoveryToken),
    });

    Notification.create({
      userId: "admin-env",
      title: "New Message",
      body: `${senderName.trim()} sent a new message.`,
      type: "message_reply",
    }).catch(() => {});

    sendPushToUser("admin-env", {
      title: "New Message",
      body: `${senderName.trim()} sent a new message.`,
      url: "/wox/admin/messages",
      tag: "admin-new-message",
    }).catch(() => {});

    return NextResponse.json(
      { message: "Recovery request sent successfully", recoveryToken, messageId: created._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/messages/recovery error:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
