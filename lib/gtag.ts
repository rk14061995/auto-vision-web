export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      params?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

function isReady(): boolean {
  return !!(GA_MEASUREMENT_ID && typeof window !== 'undefined' && typeof window.gtag === 'function')
}

export function pageview(url: string) {
  if (!isReady()) return
  window.gtag('config', GA_MEASUREMENT_ID!, {
    page_path: url,
    send_page_view: true,
  })
}

export function event(action: string, params?: Record<string, unknown>) {
  if (!isReady()) return
  window.gtag('event', action, params)
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function trackLogin(method = 'email') {
  event('login', { method })
}

export function trackLoginError(errorMessage: string) {
  event('login_error', { error_message: errorMessage })
}

export function trackSignUp(method = 'email') {
  event('sign_up', { method })
}

export function trackSignUpError(errorMessage: string) {
  event('signup_error', { error_message: errorMessage })
}

// ─── E-commerce (GA4 standard) ───────────────────────────────────────────────

export interface GA4Item {
  item_id: string
  item_name: string
  item_category: string
  price: number
  currency: string
  quantity: number
}

export function trackViewItem(item: GA4Item) {
  event('view_item', {
    currency: item.currency,
    value: item.price,
    items: [item],
  })
}

export function trackSelectItem(item: GA4Item) {
  event('select_item', {
    item_list_id: 'pricing_plans',
    item_list_name: 'Pricing Plans',
    items: [item],
  })
}

export function trackBeginCheckout(item: GA4Item) {
  event('begin_checkout', {
    currency: item.currency,
    value: item.price,
    items: [item],
  })
}

export function trackAddPaymentInfo(item: GA4Item, paymentType: string) {
  event('add_payment_info', {
    currency: item.currency,
    value: item.price,
    payment_type: paymentType,
    items: [item],
  })
}

export function trackPurchase(params: {
  transaction_id: string
  value: number
  currency: string
  item: GA4Item
}) {
  event('purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    items: [params.item],
  })
}

// ─── Checkout lifecycle ───────────────────────────────────────────────────────

export function trackPaymentInitiated(planId: string, value: number, currency: string) {
  event('payment_initiated', { plan_id: planId, value, currency })
}

export function trackPaymentCancelled(planId: string, value: number, currency: string) {
  event('payment_cancelled', { plan_id: planId, value, currency })
}

export function trackPaymentFailed(planId: string, errorMessage: string) {
  event('payment_failed', { plan_id: planId, error_message: errorMessage })
}

// ─── Car / Project ────────────────────────────────────────────────────────────

export function trackCarMakeSelected(make: string) {
  event('car_make_selected', { car_make: make })
}

export function trackCarModelSelected(make: string, model: string) {
  event('car_model_selected', { car_make: make, car_model: model })
}

export function trackCarImageUploaded(fileSizeBytes: number, fileType: string) {
  event('car_image_uploaded', {
    file_size_kb: Math.round(fileSizeBytes / 1024),
    file_type: fileType,
  })
}

export function trackCreateProject(params: {
  car_make: string
  car_model: string
  car_year: string
  car_color: string
  project_name: string
}) {
  event('create_project', params)
}

// ─── CTA / Marketing ─────────────────────────────────────────────────────────

export function trackCTAClick(label: string, location: 'hero' | 'cta_section' | 'pricing' | 'header') {
  event('cta_click', { button_label: label, cta_location: location })
}

export function trackPricingView(planCount: number) {
  event('pricing_page_viewed', { plan_count: planCount })
}
