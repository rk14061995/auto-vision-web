import type { Metadata } from "next"
import { LegalPage } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Cookie Policy — AutoVision Pro",
  description: "Learn about the cookies AutoVision Pro uses and how to manage your preferences.",
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="We use a small number of cookies to keep the platform secure and to understand how it's used."
      lastUpdated="August 3, 2026"
    >
      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work, remember your preferences, and provide analytics information to site owners.
      </p>

      <h2>2. Cookies We Use</h2>
      <p>We categorise our cookies as follows:</p>

      <h3>2.1 Strictly Necessary Cookies</h3>
      <p>These cookies are essential for the platform to function and cannot be disabled.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>next-auth.session-token</code></td>
              <td>Maintains your authenticated session</td>
              <td>30 days</td>
            </tr>
            <tr>
              <td><code>next-auth.csrf-token</code></td>
              <td>Protects against CSRF attacks</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>next-auth.callback-url</code></td>
              <td>Remembers where to redirect after login</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>referral</code></td>
              <td>Tracks referral source for attribution</td>
              <td>30 days</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2.2 Analytics Cookies</h3>
      <p>These cookies help us understand how visitors use AutoVision Pro so we can improve it. They collect anonymised, aggregated data.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>_ga</code></td>
              <td>Google Analytics 4</td>
              <td>Distinguishes unique users</td>
              <td>2 years</td>
            </tr>
            <tr>
              <td><code>_ga_*</code></td>
              <td>Google Analytics 4</td>
              <td>Maintains session state</td>
              <td>2 years</td>
            </tr>
            <tr>
              <td><code>_gid</code></td>
              <td>Google Analytics 4</td>
              <td>Distinguishes users within a session</td>
              <td>24 hours</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2.3 Payment Provider Cookies</h3>
      <p>When you proceed to checkout, Razorpay (India) or PayPal (international) may set their own cookies. These are governed by the respective providers' privacy policies.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Privacy Policy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Razorpay</td>
              <td><a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer">razorpay.com/privacy</a></td>
            </tr>
            <tr>
              <td>PayPal</td>
              <td><a href="https://www.paypal.com/us/legalhub/privacy-full" target="_blank" rel="noreferrer">paypal.com privacy statement</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3. How to Manage Cookies</h2>
      <p>You can control and delete cookies through your browser settings. Here are guides for the most common browsers:</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noreferrer">Apple Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>
      <p>
        Please note: disabling strictly necessary cookies will prevent you from logging in to AutoVision Pro. Disabling analytics cookies will not affect your ability to use the platform.
      </p>

      <h2>4. Do Not Track</h2>
      <p>
        Some browsers send a &quot;Do Not Track&quot; (DNT) signal. We currently do not alter our data collection in response to DNT signals, as there is no consistent industry standard. You can use the browser cookie controls above to limit tracking.
      </p>

      <h2>5. Google Analytics Opt-Out</h2>
      <p>
        To opt out of Google Analytics tracking across all websites, you can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">Google Analytics Opt-out Browser Add-on</a>.
      </p>

      <h2>6. Regional Cookie Rights</h2>

      <h3>6.1 United Kingdom / EEA</h3>
      <p>
        Under UK and EU rules on cookies (PECR and the ePrivacy framework, alongside UK GDPR/GDPR), you have the right to control non-essential cookies such as our analytics cookies. You can do this using the browser controls in Section 3. We are working towards a cookie consent solution that will let UK/EEA visitors opt in or out of analytics cookies before they are set; until then, please use your browser settings if you would prefer analytics cookies not to load.
      </p>

      <h3>6.2 United States — California</h3>
      <p>
        California residents have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information, including via cookies used for cross-context behavioural advertising. We do not sell or share personal information collected through cookies, so no opt-out mechanism is currently required; this section will be updated if that changes.
      </p>

      <h3>6.3 India</h3>
      <p>
        Under the Digital Personal Data Protection Act, 2023, cookies that collect personal data should be used with your knowledge. Analytics cookies on AutoVision Pro collect anonymised, aggregated usage data as described in Section 2.2; you can control them using the browser settings in Section 3.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Material changes will be communicated via an in-app notice. The &quot;Last updated&quot; date at the top reflects the most recent revision.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about our cookie practices? Email us at <a href="mailto:privacy@auto-vision-pro.com">privacy@auto-vision-pro.com</a> or visit our <a href="/contact">Contact page</a>.
      </p>
    </LegalPage>
  )
}
