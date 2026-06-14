import "server-only"
import nodemailer from "nodemailer"

const ADMIN_EMAIL = "autovisionpro07@gmail.com"
const APP_NAME = "AutoVision Pro"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://auto-vision-pro.com"

function createTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  })
}

async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
}) {
  const transporter = createTransporter()
  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping email:", options.subject)
    return
  }

  const from = `"${APP_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`
  const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to

  try {
    await transporter.sendMail({ from, to: recipients, subject: options.subject, html: options.html })
  } catch (err) {
    console.error("[email] Failed to send:", options.subject, err)
  }
}

// ─── Shared layout ──────────────────────────────────────────────────────────

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body { margin:0; padding:0; background:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#333; }
  .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .header { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); padding:32px 40px; text-align:center; }
  .header img { height:40px; margin-bottom:12px; }
  .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-.3px; }
  .header p  { margin:6px 0 0; color:rgba(255,255,255,.7); font-size:13px; }
  .body { padding:36px 40px; }
  .body h2 { margin:0 0 8px; font-size:20px; font-weight:700; color:#1a1a2e; }
  .body p  { margin:0 0 16px; font-size:15px; line-height:1.6; color:#555; }
  .box { background:#f8f9fc; border:1px solid #e8eaf0; border-radius:10px; padding:20px 24px; margin:20px 0; }
  .box table { width:100%; border-collapse:collapse; }
  .box td { padding:6px 0; font-size:14px; }
  .box td:first-child { color:#888; width:40%; }
  .box td:last-child { font-weight:600; color:#1a1a2e; text-align:right; }
  .badge { display:inline-block; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700; }
  .badge-green { background:#e6f9f0; color:#0d7a4e; }
  .badge-red { background:#fee; color:#c0392b; }
  .badge-orange { background:#fff3e0; color:#e65100; }
  .btn { display:inline-block; margin:20px 0; padding:14px 32px; background:#0f3460; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:700; font-size:15px; }
  .footer { padding:24px 40px; border-top:1px solid #eee; text-align:center; }
  .footer p { margin:0; font-size:12px; color:#aaa; line-height:1.8; }
  .footer a { color:#0f3460; text-decoration:none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>⚡ ${APP_NAME}</h1>
    <p>AI-Powered Car Wrap Design Studio</p>
  </div>
  <div class="body">
    ${body}
  </div>
  <div class="footer">
    <p>${APP_NAME} · <a href="${APP_URL}">${APP_URL}</a><br/>
    You're receiving this because of activity on your account.</p>
  </div>
</div>
</body>
</html>`
}

// ─── Templates ───────────────────────────────────────────────────────────────

function welcomeTemplate(name: string, email: string) {
  return layout("Welcome to AutoVision Pro", `
    <h2>Welcome aboard, ${name}! 🎉</h2>
    <p>Your account has been created successfully. You're on the <strong>Free plan</strong> with 5 AI credits to get started.</p>
    <div class="box">
      <table>
        <tr><td>Email</td><td>${email}</td></tr>
        <tr><td>Plan</td><td>Free</td></tr>
        <tr><td>AI Credits</td><td>5</td></tr>
        <tr><td>Projects</td><td>Up to 3</td></tr>
      </table>
    </div>
    <p>Head to your dashboard to start designing stunning car wraps with AI.</p>
    <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
    <p style="margin-top:24px;font-size:13px;color:#888;">Need help? Reply to this email or visit our support page.</p>
  `)
}

function welcomeAdminTemplate(name: string, email: string) {
  return layout("New User Registered", `
    <h2>New User Registration</h2>
    <p>A new user just signed up on ${APP_NAME}.</p>
    <div class="box">
      <table>
        <tr><td>Name</td><td>${name}</td></tr>
        <tr><td>Email</td><td>${email}</td></tr>
        <tr><td>Time</td><td>${new Date().toUTCString()}</td></tr>
      </table>
    </div>
  `)
}

function paymentSuccessTemplate(opts: {
  name: string
  email: string
  planOrItem: string
  amount: string
  currency: string
  orderId: string
  provider: string
  kind: "subscription" | "credit_pack" | "ad" | "ad_free" | "design_request"
}) {
  const kindLabel: Record<string, string> = {
    subscription: "Subscription",
    credit_pack: "AI Credit Pack",
    ad: "Advertisement",
    ad_free: "Ad-Free Upgrade",
    design_request: "Design Request",
  }
  return layout("Payment Successful", `
    <h2>Payment Confirmed ✅</h2>
    <p>Hi ${opts.name}, your payment was processed successfully.</p>
    <div class="box">
      <table>
        <tr><td>Type</td><td>${kindLabel[opts.kind] ?? opts.kind}</td></tr>
        <tr><td>Item</td><td>${opts.planOrItem}</td></tr>
        <tr><td>Amount</td><td>${opts.currency} ${opts.amount}</td></tr>
        <tr><td>Order ID</td><td style="font-size:12px;">${opts.orderId}</td></tr>
        <tr><td>Provider</td><td>${opts.provider}</td></tr>
        <tr><td>Date</td><td>${new Date().toUTCString()}</td></tr>
      </table>
    </div>
    <p>Your access has been activated. Visit your dashboard to start using ${APP_NAME}.</p>
    <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
  `)
}

function paymentSuccessAdminTemplate(opts: {
  name: string
  email: string
  planOrItem: string
  amount: string
  currency: string
  orderId: string
  provider: string
  kind: string
}) {
  return layout("New Payment Received", `
    <h2>💰 New Payment Received</h2>
    <div class="box">
      <table>
        <tr><td>Customer</td><td>${opts.name}</td></tr>
        <tr><td>Email</td><td>${opts.email}</td></tr>
        <tr><td>Type</td><td>${opts.kind}</td></tr>
        <tr><td>Item</td><td>${opts.planOrItem}</td></tr>
        <tr><td>Amount</td><td>${opts.currency} ${opts.amount}</td></tr>
        <tr><td>Order ID</td><td style="font-size:12px;">${opts.orderId}</td></tr>
        <tr><td>Provider</td><td>${opts.provider}</td></tr>
        <tr><td>Time</td><td>${new Date().toUTCString()}</td></tr>
      </table>
    </div>
  `)
}

function paymentFailedTemplate(name: string, provider: string, reason?: string) {
  return layout("Payment Failed", `
    <h2>Payment Failed <span class="badge badge-red">Failed</span></h2>
    <p>Hi ${name}, we were unable to process your payment via ${provider}.</p>
    ${reason ? `<div class="box"><p style="margin:0;font-size:14px;color:#c0392b;">${reason}</p></div>` : ""}
    <p>Please update your payment method and try again, or contact support if the issue persists.</p>
    <a href="${APP_URL}/dashboard/billing" class="btn">Update Payment →</a>
  `)
}

function subscriptionCancelledTemplate(name: string, endsAt?: string) {
  return layout("Subscription Cancelled", `
    <h2>Subscription Cancelled</h2>
    <p>Hi ${name}, your ${APP_NAME} subscription has been cancelled.</p>
    ${endsAt ? `<div class="box"><table><tr><td>Access until</td><td>${new Date(endsAt).toDateString()}</td></tr></table></div>` : ""}
    <p>You'll continue to have access until your billing period ends. After that, you'll be moved to the Free plan.</p>
    <a href="${APP_URL}/pricing" class="btn">Re-subscribe →</a>
  `)
}

function subscriptionPausedTemplate(name: string) {
  return layout("Subscription Paused", `
    <h2>Subscription Paused <span class="badge badge-orange">Paused</span></h2>
    <p>Hi ${name}, your subscription has been paused due to a billing issue.</p>
    <p>Please update your payment method to restore full access.</p>
    <a href="${APP_URL}/dashboard/billing" class="btn">Fix Billing →</a>
  `)
}

function creditPackGrantedTemplate(name: string, credits: number, packName: string, orderId: string) {
  return layout("AI Credits Added", `
    <h2>AI Credits Added ✨</h2>
    <p>Hi ${name}, your credit pack purchase was successful!</p>
    <div class="box">
      <table>
        <tr><td>Pack</td><td>${packName}</td></tr>
        <tr><td>Credits Added</td><td><strong>+${credits} credits</strong></td></tr>
        <tr><td>Order ID</td><td style="font-size:12px;">${orderId}</td></tr>
      </table>
    </div>
    <p>Your credits are available immediately in your dashboard.</p>
    <a href="${APP_URL}/dashboard" class="btn">Start Creating →</a>
  `)
}

// ─── Public email functions ──────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string) {
  await Promise.all([
    sendEmail({ to: email, subject: `Welcome to ${APP_NAME}! 🎉`, html: welcomeTemplate(name, email) }),
    sendEmail({ to: ADMIN_EMAIL, subject: `New signup: ${name} (${email})`, html: welcomeAdminTemplate(name, email) }),
  ])
}

export async function sendPaymentSuccessEmail(opts: {
  name: string
  email: string
  planOrItem: string
  amount: string
  currency: string
  orderId: string
  provider: string
  kind: "subscription" | "credit_pack" | "ad" | "ad_free" | "design_request"
}) {
  await Promise.all([
    sendEmail({
      to: opts.email,
      subject: `Payment confirmed — ${opts.planOrItem}`,
      html: paymentSuccessTemplate(opts),
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `💰 New payment: ${opts.currency} ${opts.amount} from ${opts.email}`,
      html: paymentSuccessAdminTemplate(opts),
    }),
  ])
}

export async function sendCreditPackEmail(opts: {
  name: string
  email: string
  credits: number
  packName: string
  orderId: string
  amount: string
  currency: string
}) {
  await Promise.all([
    sendEmail({
      to: opts.email,
      subject: `${opts.credits} AI Credits added to your account`,
      html: creditPackGrantedTemplate(opts.name, opts.credits, opts.packName, opts.orderId),
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `💰 Credit pack purchased: ${opts.credits} credits by ${opts.email}`,
      html: paymentSuccessAdminTemplate({
        name: opts.name,
        email: opts.email,
        planOrItem: `${opts.credits}-credit pack`,
        amount: opts.amount,
        currency: opts.currency,
        orderId: opts.orderId,
        provider: "razorpay",
        kind: "credit_pack",
      }),
    }),
  ])
}

export async function sendPaymentFailedEmail(name: string, email: string, provider: string, reason?: string) {
  await Promise.all([
    sendEmail({
      to: email,
      subject: "Payment failed — action required",
      html: paymentFailedTemplate(name, provider, reason),
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `⚠️ Payment failed: ${email} via ${provider}`,
      html: paymentFailedTemplate(name, provider, reason),
    }),
  ])
}

export async function sendSubscriptionCancelledEmail(name: string, email: string, endsAt?: string) {
  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} subscription has been cancelled`,
    html: subscriptionCancelledTemplate(name, endsAt),
  })
}

export async function sendSubscriptionPausedEmail(name: string, email: string) {
  await sendEmail({
    to: email,
    subject: `Action required — ${APP_NAME} subscription paused`,
    html: subscriptionPausedTemplate(name),
  })
}
