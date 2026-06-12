import type { Metadata } from "next"
import { LegalPage } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Refund Policy — AutoVision Pro",
  description: "AutoVision Pro's refund policy for subscriptions, AI credit packs, advertising placements, design services, and website building services.",
}

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="We want you to be happy with every purchase. Here's how refunds work."
      lastUpdated="June 11, 2026"
    >
      <h2>1. Overview</h2>
      <p>
        This policy applies to all purchases made on AutoVision Pro, including subscriptions, AI credit packs, advertising placements, creative design services, and website building services. Refund eligibility depends on the product type and the circumstances of the request.
      </p>
      <p>
        To request a refund, email <a href="mailto:autovisionpro07@gmail.com">autovisionpro07@gmail.com</a> with your order details. We aim to respond within 2 business days.
      </p>

      <h2>2. Subscription Plans</h2>
      <h3>2.1 Monthly Subscriptions</h3>
      <p>
        Monthly subscriptions may be cancelled at any time from the dashboard. Your access continues until the end of the current billing period. <strong>We do not issue pro-rated refunds for unused days</strong> in a monthly cycle.
      </p>
      <h3>2.2 Annual Subscriptions</h3>
      <p>
        If you cancel an annual subscription within <strong>14 days</strong> of purchase and have not used the AI credits included in the plan, you are eligible for a full refund. After 14 days, no refund is issued for the remaining subscription period. Refund requests after 14 days but with legitimate extenuating circumstances will be reviewed case-by-case.
      </p>
      <h3>2.3 Free Plan</h3>
      <p>The free plan has no charges; no refund is applicable.</p>

      <h2>3. AI Credit Packs</h2>
      <p>
        AI credit packs (100, 500, or 2000 credits) are <strong>non-refundable once any credits have been consumed</strong>. If you purchase a credit pack and have not used any credits, you may request a full refund within 7 days of purchase. After 7 days or after any credits are consumed, no refund is available.
      </p>

      <h2>4. Advertising Placements</h2>
      <h3>4.1 Pre-approval</h3>
      <p>
        If your advertisement is <strong>rejected by our admin team</strong> (e.g., due to content policy violations or being unrelated to the automotive sector), you will receive a <strong>full refund</strong> automatically within 5–7 business days.
      </p>
      <h3>4.2 After Approval</h3>
      <p>
        Once an ad is approved and running, refunds are not available for unused days. If a technical error on our platform prevents your ad from displaying during your paid period, we will issue a credit or prorated refund for the affected days upon verification.
      </p>
      <h3>4.3 Advertiser Cancellation</h3>
      <p>
        If you wish to cancel an approved ad before its run begins, contact us within 24 hours of payment to request a refund. After the ad goes live, no cancellation refund is available.
      </p>

      <h2>5. Creative Design Service</h2>
      <h3>5.1 Before Work Begins</h3>
      <p>
        If you cancel your design request before our team has started work (status: &quot;paid&quot;), you are eligible for a <strong>full refund</strong>.
      </p>
      <h3>5.2 After Work Has Begun</h3>
      <p>
        Once your request moves to &quot;in progress&quot;, we cannot issue a refund. You are entitled to <strong>one revision</strong> of the delivered creative at no additional charge. If the delivered creative materially fails to match your approved brief, contact us within 7 days and we will either revise it or issue a partial refund at our discretion.
      </p>
      <h3>5.3 Delivery Timeline</h3>
      <p>
        Standard delivery is 2–3 business days. If we exceed 7 business days without delivery, you may request a full refund.
      </p>

      <h2>6. Website Building Service</h2>
      <h3>6.1 Monthly Subscription</h3>
      <p>
        The website building service is subscription-based ($99/month or ₹2,999/month). You may cancel at any time from your dashboard. Cancellation takes effect at the end of the current billing month — no pro-rated refunds are issued.
      </p>
      <h3>6.2 First Month Guarantee</h3>
      <p>
        If you are not satisfied with the initial website delivered within the first 30 days of your subscription, contact us. We will work to resolve your concerns. If we cannot meet your requirements, we will issue a refund for the first month.
      </p>
      <h3>6.3 Domain and Third-Party Costs</h3>
      <p>
        Domain registration fees and third-party service costs (if applicable) are non-refundable as they are passed directly to third-party providers.
      </p>

      <h2>7. How to Request a Refund</h2>
      <ol>
        <li>Email <a href="mailto:autovisionpro07@gmail.com">autovisionpro07@gmail.com</a> with subject line &quot;Refund Request — [Order ID]&quot;.</li>
        <li>Include your registered email address, the product purchased, and the reason for your request.</li>
        <li>We will review and respond within 2 business days.</li>
        <li>Approved refunds are processed to the original payment method within 5–10 business days (Razorpay/PayPal processing times may vary).</li>
      </ol>

      <h2>8. Chargebacks</h2>
      <p>
        We encourage you to contact us before initiating a chargeback with your bank. Unresolved chargebacks may result in account suspension. We will provide all relevant documentation to your bank in the event of a dispute.
      </p>

      <h2>9. Contact</h2>
      <p>
        For any refund questions, contact us at <a href="mailto:autovisionpro07@gmail.com">autovisionpro07@gmail.com</a> or use the <a href="/contact">Contact page</a>.
      </p>
    </LegalPage>
  )
}
