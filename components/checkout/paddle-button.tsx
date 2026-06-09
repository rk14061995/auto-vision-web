// DISABLED — Paddle replaced by PayPal for international payments.
// Preserved in block comment for future re-enable.
//
// "use client"
//
// import Script from "next/script"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Loader2 } from "lucide-react"
// import { trackBeginCheckout, type GA4Item } from "@/lib/gtag"
//
// declare global {
//   interface Window {
//     Paddle?: {
//       Setup: (config: { token: string }) => void
//       Checkout: {
//         open: (config: {
//           items: Array<{ priceId: string; quantity: number }>
//           customer?: { email?: string }
//           discountCode?: string
//           customData?: Record<string, string>
//         }) => void
//       }
//     }
//   }
// }
//
// interface PaddleButtonProps {
//   priceId: string
//   email?: string
//   planName: string
//   planId: string
//   priceUSD: number
//   discountCode?: string
// }
//
// export function PaddleButton({
//   priceId,
//   email,
//   planName,
//   planId,
//   priceUSD,
//   discountCode,
// }: PaddleButtonProps) {
//   const [paddleReady, setPaddleReady] = useState(false)
//   const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""
//
//   const ga4Item: GA4Item = {
//     item_id: planId,
//     item_name: planName,
//     item_category: "subscription",
//     price: priceUSD,
//     currency: "USD",
//     quantity: 1,
//   }
//
//   function handleClick() {
//     if (!window.Paddle) return
//     trackBeginCheckout(ga4Item)
//     window.Paddle.Checkout.open({
//       items: [{ priceId, quantity: 1 }],
//       customer: email ? { email } : undefined,
//       discountCode: discountCode || undefined,
//       customData: { email: email ?? "" },
//     })
//   }
//
//   return (
//     <>
//       <Script
//         src="https://cdn.paddle.com/paddle/v2/paddle.js"
//         strategy="lazyOnload"
//         onLoad={() => {
//           if (window.Paddle && clientToken) {
//             window.Paddle.Setup({ token: clientToken })
//             setPaddleReady(true)
//           }
//         }}
//       />
//       <Button
//         onClick={handleClick}
//         disabled={!paddleReady}
//         className="w-full gap-2"
//       >
//         {!paddleReady && <Loader2 className="h-4 w-4 animate-spin" />}
//         {paddleReady ? `Subscribe to ${planName}` : "Loading checkout..."}
//       </Button>
//     </>
//   )
// }
//
// export function PaddleButtonLoading() {
//   return (
//     <Button disabled className="w-full gap-2">
//       <Loader2 className="h-4 w-4 animate-spin" />
//       Loading checkout...
//     </Button>
//   )
// }
