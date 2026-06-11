import type { Metadata } from "next"
import { LegalPage } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy — AutoVision Pro",
  description: "Learn how AutoVision Pro collects, uses, and protects your personal data.",
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="We take your privacy seriously. Here's exactly how we handle your data."
      lastUpdated="June 11, 2026"
    >
      <h2>1. Who We Are</h2>
      <p>
        AutoVision Pro (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the AutoVision Pro platform at <a href="https://auto-vision-pro.com">auto-vision-pro.com</a>. We provide AI-powered car customisation tools, advertising placement services, creative design services, and website building services for the automotive sector.
      </p>
      <p>
        For questions about this policy, contact us at <a href="mailto:privacy@auto-vision-pro.com">privacy@auto-vision-pro.com</a>.
      </p>

      <h2>2. Data We Collect</h2>
      <h3>2.1 Account Data</h3>
      <p>When you register, we collect your name, email address, and (optionally) a profile picture. If you sign in with Google or another OAuth provider, we receive the data that provider shares with us.</p>

      <h3>2.2 Payment Data</h3>
      <p>
        We do not store card numbers or bank details. Payments are processed by:
      </p>
      <ul>
        <li><strong>Razorpay</strong> (India, INR transactions) — <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer">Razorpay Privacy Policy</a></li>
        <li><strong>PayPal</strong> (international, USD transactions) — <a href="https://www.paypal.com/us/legalhub/privacy-full" target="_blank" rel="noreferrer">PayPal Privacy Policy</a></li>
      </ul>
      <p>We store only the transaction ID, amount, and currency to record that a payment occurred.</p>

      <h3>2.3 Usage Data</h3>
      <p>We log AI credit usage events (feature used, credits consumed, timestamp) to maintain accurate credit balances and detect abuse. We also record ad impressions and click counts per advertisement.</p>

      <h3>2.4 Uploaded Content</h3>
      <p>Car images you upload for background removal or part detection, and creative assets you upload for advertising, are stored via <strong>Cloudinary</strong> (<a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer">Cloudinary Privacy Policy</a>). Images sent to our AI routes are processed by <strong>Anthropic's Claude API</strong> and are not used to train Anthropic's models per their enterprise data handling policy.</p>

      <h3>2.5 Analytics Data</h3>
      <p>We use <strong>Google Analytics 4</strong> to understand how users interact with our platform. GA4 collects anonymised usage data, including pages visited, session duration, and feature engagement. GA4 may set cookies on your device. See Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> for details. We also use <strong>Vercel Analytics</strong> for performance monitoring.</p>

      <h3>2.6 Lead Capture Data</h3>
      <p>If you submit your email via our pricing lead form, we store your email address, the plan you expressed interest in, and the timestamp. We use this only to follow up with pricing information.</p>

      <h3>2.7 Cookies</h3>
      <p>See our <a href="/cookies">Cookie Policy</a> for a full list of cookies we set and why.</p>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>Authenticating your account and maintaining session security.</li>
        <li>Processing payments and issuing credit packs or subscriptions.</li>
        <li>Deducting AI credits and maintaining an accurate balance.</li>
        <li>Displaying your advertisements to our user base.</li>
        <li>Delivering creative design and website building services.</li>
        <li>Sending transactional emails (payment confirmations, ad approval notices, design delivery).</li>
        <li>Improving the Platform through aggregate, anonymised analytics.</li>
        <li>Detecting and preventing fraud and abuse.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal data to third parties or use it for targeted advertising outside our Platform.</p>

      <h2>4. Legal Basis for Processing (GDPR)</h2>
      <p>For users in the European Economic Area, our legal bases are:</p>
      <ul>
        <li><strong>Contract</strong> — processing necessary to fulfil your subscription or service order.</li>
        <li><strong>Legitimate interest</strong> — fraud prevention, platform security, aggregate analytics.</li>
        <li><strong>Consent</strong> — non-essential cookies and marketing emails (you may withdraw at any time).</li>
      </ul>

      <h2>5. Data Sharing</h2>
      <p>We share data only with the following categories of sub-processors, each bound by appropriate data processing agreements:</p>
      <ul>
        <li><strong>MongoDB Atlas</strong> (database hosting, AWS ap-south-1 region by default)</li>
        <li><strong>Cloudinary</strong> (image storage and delivery)</li>
        <li><strong>Anthropic</strong> (Claude AI — image and text processing)</li>
        <li><strong>Remove.bg</strong> (background removal processing)</li>
        <li><strong>Razorpay</strong> (payment processing, India)</li>
        <li><strong>PayPal</strong> (payment processing, international)</li>
        <li><strong>Google</strong> (analytics)</li>
        <li><strong>Vercel</strong> (hosting and edge network)</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        Account data is retained for as long as your account is active. If you delete your account, we delete your personal profile within 30 days. Payment records are retained for 7 years for tax and legal compliance. Anonymous analytics data has no fixed retention limit.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
        <li>Object to or restrict certain processing.</li>
        <li>Data portability (receive your data in a machine-readable format).</li>
        <li>Withdraw consent where processing is based on consent.</li>
      </ul>
      <p>To exercise any of these rights, email <a href="mailto:privacy@auto-vision-pro.com">privacy@auto-vision-pro.com</a>. We will respond within 30 days.</p>

      <h2>8. Security</h2>
      <p>
        We use HTTPS/TLS for all data in transit. Passwords are hashed using bcrypt. API keys and secrets are stored as environment variables and never exposed client-side. We conduct regular dependency audits. Despite our best efforts, no system is 100% secure — please use a strong, unique password.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        AutoVision Pro is not directed at children under 13 (or under 16 in the EEA). We do not knowingly collect data from minors. If you believe a minor has registered, contact us and we will delete the account promptly.
      </p>

      <h2>10. International Transfers</h2>
      <p>
        Our primary infrastructure is governed by Indian law. If you are located outside India, your data may be transferred to and processed in India or other countries where our sub-processors operate. We rely on standard contractual clauses or sub-processor certifications to ensure adequate protection.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this policy to reflect changes in our practices or applicable law. We will notify you of material changes by email or in-app notice at least 14 days in advance. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy-related questions or requests, contact our data protection contact at <a href="mailto:privacy@auto-vision-pro.com">privacy@auto-vision-pro.com</a> or use our <a href="/contact">Contact form</a>.
      </p>
    </LegalPage>
  )
}
