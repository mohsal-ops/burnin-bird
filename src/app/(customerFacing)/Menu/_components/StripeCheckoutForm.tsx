"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import Image from "next/image"
import { FormEvent, useState } from "react"
import { undefined, z } from "zod"
import { useFormState } from "react-dom"
import PageHeader from "../../_components/PageHeader"

type CheckoutFormProps = {
    priceInCents: number
    deliveryFeeInCents?: number
    clientSecret: string
    loyaltyEnabled?: boolean
    loyaltyConsentText?: string
}
export function StripeCheckoutForm(
    { priceInCents, deliveryFeeInCents = 0, clientSecret, loyaltyEnabled = false, loyaltyConsentText = ""

    }: CheckoutFormProps) {
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)


    return (
        <div className=" max-w-5xl mt-3 w-full mx-auto space-y-8 ">
            <PageHeader>Checkout</PageHeader>
            <Elements options={{ clientSecret }} stripe={stripePromise}>
                <Form priceInCents={priceInCents} deliveryFeeInCents={deliveryFeeInCents} loyaltyEnabled={loyaltyEnabled} loyaltyConsentText={loyaltyConsentText} />
            </Elements>
        </div>
    )

}



function Form({ priceInCents, deliveryFeeInCents = 0, loyaltyEnabled = false, loyaltyConsentText = "" }: { priceInCents: number; deliveryFeeInCents?: number; loyaltyEnabled?: boolean; loyaltyConsentText?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [ErrorMessage, setErrorMessage] = useState<string>()
    const [email, setEmail] = useState<string>()
    // SMS marketing opt-in (only when the loyalty add-on is enabled). Unchecked by
    // default — never pre-checked (that's not valid consent).
    const [smsOptIn, setSmsOptIn] = useState(false)
    const [smsPhone, setSmsPhone] = useState("")
    const [smsBirthday, setSmsBirthday] = useState("")



    const stripe = useStripe()
    const elements = useElements()

    async function OnsubmitHandler(e: FormEvent) {
        e.preventDefault()
        console.log('start')
        if (stripe == null || elements == null || email == null) return

        setIsLoading(true)
        console.log('start')

        // Record the SMS opt-in (best-effort — never blocks the payment).
        if (loyaltyEnabled && smsOptIn && smsPhone.trim()) {
            try {
                await fetch("/api/loyalty/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        phone: smsPhone,
                        birthday: smsBirthday || undefined,
                        consentTextVersion: loyaltyConsentText,
                    }),
                })
            } catch { /* opt-in failure must not block checkout */ }
        }



        stripe.confirmPayment({
            elements, confirmParams:
            {
                return_url: `${window.location.origin}/stripe/purchase-success`,
                receipt_email: email,
        
            }
        }).then(({ error }) => {
            if (error.type === "card_error" || error.type === "validation_error") {
                setErrorMessage(error.message)
            } else {
                setErrorMessage("unkown error occured")
            }


        }).finally(() => {
            console.log('end')

            setIsLoading(false)
        })

    }
    return <form onSubmit={OnsubmitHandler}>
        <Card className="mt-3 flex flex-col gap-3">
            <CardHeader className="h-auto">
                <div className="text-2xl font-bold ">Checkout</div>
            </CardHeader>
            {ErrorMessage &&
                <CardDescription className="pl-6">
                    {ErrorMessage}
                </CardDescription>
            }
            <CardContent>
                <PaymentElement />
                <div className="mt-4">
                    <LinkAuthenticationElement onChange={e => setEmail(e.value.email)} />
                </div>
                {loyaltyEnabled && (
                    <div className="mt-4 rounded-xl border border-border p-3">
                        <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" checked={smsOptIn} onChange={e => setSmsOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                            <span>{loyaltyConsentText}</span>
                        </label>
                        {smsOptIn && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="Mobile number" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                                <input type="date" value={smsBirthday} onChange={e => setSmsBirthday(e.target.value)} title="Birthday (optional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none focus:border-primary" />
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
                {deliveryFeeInCents > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Uber delivery fee</span>
                        <span>{formatCurrency(deliveryFeeInCents / 100)}</span>
                    </div>
                )}
                <Button className="w-full" variant='mainButton' disabled={isLoading || !stripe || !elements}>
                    {isLoading ? "Purchasing..." : `Purchase - ${formatCurrency(priceInCents / 100)}`}
                </Button>
            </CardFooter>
        </Card>

    </form>

}