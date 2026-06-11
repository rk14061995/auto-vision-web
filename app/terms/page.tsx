import type { Metadata } from "next"
import { LegalPage } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Terms and Conditions — AutoVision Pro",
  description: "Read the Terms and Conditions for using AutoVision Pro's car customization platform, advertising services, and creative design services.",
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      subtitle="Please read these terms carefully before using AutoVision Pro."
      lastUpdated="June 11, 2026"
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using AutoVision Pro (&quot;Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Platform. These terms apply to all visitors, registered users, advertisers, and customers of our creative services.
      </p>

      <h2>2. Description of Service</h2>
      <p>AutoVision Pro provides:</p>
      <ul>
        <li><strong>Car Customization Platform</strong> — AI-powered virtual car wrap design, colour customization, and accessory fitting tools.</li>
        <li><strong>Advertising Platform</strong> — Paid placement slots for automotive businesses to reach our user base.</li>
        <li><strong>Creative Design Service</strong> — Professional ad banner and creative design delivered by our team.</li>
        <li><strong>Website Building Service</strong> — Custom website design and hosting for automotive businesses at a monthly subscription.</li>
      </ul>

      <h2>3. User Accounts</h2>
      <p>
        You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately at <a href="mailto:support@auto-vision-pro.com">support@auto-vision-pro.com</a> if you suspect unauthorised access.
      </p>
      <p>
        We reserve the right to suspend or terminate accounts that violate these terms, including accounts used for fraud, spam, or abuse of our AI credit system.
      </p>

      <h2>4. Subscriptions and Payments</h2>
      <h3>4.1 Subscription Plans</h3>
      <p>
        Paid subscriptions (Creator, Pro, Studio) are billed monthly or annually. Prices are shown in INR for Indian users (processed via Razorpay) and USD for international users (processed via PayPal). Prices are inclusive of applicable taxes.
      </p>
      <h3>4.2 Free Trial</h3>
      <p>
        New accounts receive a limited free plan. Promotional free-trial periods may be offered from time to time. At the end of any trial, your account reverts to the free tier unless you subscribe.
      </p>
      <h3>4.3 AI Credits</h3>
      <p>
        AI credits are consumed when you use AI-powered features (car part detection, background removal, colour themes). Monthly credits reset on your billing date. Purchased credit packs never expire. Credits are non-transferable and have no cash value.
      </p>
      <h3>4.4 Advertising Payments</h3>
      <p>
        Ad placement fees are one-time payments for a fixed duration (7 or 30 days). Ads become active upon payment verification and admin approval.
      </p>
      <h3>4.5 Creative Design Service</h3>
      <p>
        Design service fees are one-time payments per project. Delivery is within 2–3 business days unless otherwise stated. One revision is included.
      </p>
      <h3>4.6 Website Building Service</h3>
      <p>
        Website subscriptions are billed at $99/month (USD) or ₹2,999/month (INR). The subscription covers hosting, maintenance, and content updates as agreed. Cancellation takes effect at the end of the current billing month.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Upload content that is illegal, defamatory, obscene, or infringes third-party intellectual property rights.</li>
        <li>Use automated tools to scrape, crawl, or extract data from the Platform.</li>
        <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Platform.</li>
        <li>Share or resell your AI credits or account access.</li>
        <li>Submit false or misleading information in advertising or design briefs.</li>
        <li>Use the Platform to promote illegal products, services, or activities.</li>
      </ul>

      <h2>6. Advertising Content</h2>
      <p>
        All advertisements are subject to admin review before activation. We reserve the right to reject or remove any ad that violates our content guidelines, including content that is misleading, offensive, or unrelated to the automotive sector. Rejected ads are eligible for a refund per our Refund Policy.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The AutoVision Pro platform, its design, code, and branding are owned by AutoVision Pro and protected by applicable intellectual property laws. You retain ownership of content you upload (images, logos, designs). By uploading content, you grant us a non-exclusive, royalty-free licence to use it solely for delivering the requested service.
      </p>
      <p>
        Creative assets delivered by our design team are licensed to you for commercial use. We retain the right to display them in our portfolio unless you request otherwise in writing.
      </p>

      <h2>8. Privacy</h2>
      <p>
        Our collection and use of personal data is governed by our <a href="/privacy">Privacy Policy</a>, which forms part of these terms.
      </p>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        The Platform is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that AI-generated outputs will meet your specific requirements.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, AutoVision Pro shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Platform, even if we have been advised of the possibility of such damages. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may cancel your subscription at any time via the dashboard. We may terminate or suspend your access immediately for breach of these terms. Upon termination, your right to use the Platform ceases; data may be retained as described in the Privacy Policy.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.
      </p>

      <h2>13. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be communicated by email or an in-app notice at least 14 days before taking effect. Continued use after changes constitutes acceptance.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these terms? Contact us at <a href="mailto:support@auto-vision-pro.com">support@auto-vision-pro.com</a> or via our <a href="/contact">Contact page</a>.
      </p>
    </LegalPage>
  )
}
