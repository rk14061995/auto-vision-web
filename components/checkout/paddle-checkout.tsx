// DISABLED — Paddle replaced by PayPal for international payments.
// Preserved in block comment for future re-enable.
//
// "use client"
//
// import { useState } from "react"
// import { PaddleButton } from "@/components/checkout/paddle-button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"
//
// export function PaddleCheckout({
//   priceId,
//   email,
//   planName,
//   planId,
//   priceUSD,
// }: {
//   priceId: string
//   email: string
//   planName: string
//   planId: string
//   priceUSD: number
// }) {
//   const [discountCode, setDiscountCode] = useState("")
//   const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined)
//
//   return (
//     <div className="space-y-6">
//       <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
//         <div className="space-y-2">
//           <Label htmlFor="coupon">Coupon</Label>
//           <Input
//             id="coupon"
//             value={discountCode}
//             onChange={(e) => setDiscountCode(e.target.value)}
//             placeholder="Enter coupon code"
//           />
//         </div>
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => setAppliedCode(discountCode.trim() || undefined)}
//         >
//           Apply
//         </Button>
//       </div>
//
//       <PaddleButton
//         priceId={priceId}
//         email={email}
//         planName={planName}
//         planId={planId}
//         priceUSD={priceUSD}
//         discountCode={appliedCode}
//       />
//
//       <p className="text-center text-xs text-muted-foreground">
//         If your coupon is valid, Paddle will apply it at checkout.
//       </p>
//     </div>
//   )
// }
