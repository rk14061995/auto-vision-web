import crypto from "node:crypto"

const KEY = process.env.PAYU_MERCHANT_KEY ?? ""
const SALT = process.env.PAYU_MERCHANT_SALT ?? ""
const MODE = process.env.PAYU_MODE ?? "test"

export const PAYU_PAYMENT_URL =
  MODE === "live"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment"

export function isPayUConfigured(): boolean {
  return Boolean(KEY && SALT)
}

export function generateTxnId(): string {
  return `av_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

export interface PayUHashParams {
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

export function generatePayUHash(p: PayUHashParams): string {
  const { txnid, amount, productinfo, firstname, email } = p
  const u1 = p.udf1 ?? ""
  const u2 = p.udf2 ?? ""
  const u3 = p.udf3 ?? ""
  const u4 = p.udf4 ?? ""
  const u5 = p.udf5 ?? ""
  const str = `${KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${u1}|${u2}|${u3}|${u4}|${u5}||||||${SALT}`
  return crypto.createHash("sha512").update(str).digest("hex")
}

export interface PayUResponseParams {
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  status: string
  hash: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

export function verifyPayUResponse(p: PayUResponseParams): boolean {
  if (!SALT) return false
  const u1 = p.udf1 ?? ""
  const u2 = p.udf2 ?? ""
  const u3 = p.udf3 ?? ""
  const u4 = p.udf4 ?? ""
  const u5 = p.udf5 ?? ""
  // PayU reverse hash: salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const str = `${SALT}|${p.status}|${u5}|${u4}|${u3}|${u2}|${u1}|${p.email}|${p.firstname}|${p.productinfo}|${p.amount}|${p.txnid}|${KEY}`
  const expected = crypto.createHash("sha512").update(str).digest("hex")
  return expected === p.hash
}

export function getPayUKey(): string {
  return KEY
}
