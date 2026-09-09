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
import LoyaltySignupForm from "../../rewards/_components/LoyaltySignupForm"

type CheckoutFormProps = {
    priceInCents: number
    deliveryFeeInCents?: number
    clientSecret: string
    loyaltyEnabled?: boolean
    loyaltyConsentText?: string
    loyaltyIncentive?: string
}
export function StripeCheckoutForm(
    { priceInCents, deliveryFeeInCents = 0, clientSecret, loyaltyEnabled = false, loyaltyConsentText = "", loyaltyIncentive = ""

    }: CheckoutFormProps) {
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)


    return (
        <div className=" max-w-5xl mt-3 w-full mx-auto space-y-8 ">
            <PageHeader>Checkout</PageHeader>
            <Elements options={{ clientSecret }} stripe={stripePromise}>
                <Form priceInCents={priceInCents} deliveryFeeInCents={deliveryFeeInCents} loyaltyEnabled={loyaltyEnabled} loyaltyConsentText={loyaltyConsentText} loyaltyIncentive={loyaltyIncentive} />
            </Elements>
        </div>
    )

}



function Form({ priceInCents, deliveryFeeInCents = 0, loyaltyEnabled = false, loyaltyConsentText = "", loyaltyIncentive = "" }: { priceInCents: number; deliveryFeeInCents?: number; loyaltyEnabled?: boolean; loyaltyConsentText?: string; loyaltyIncentive?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [ErrorMessage, setErrorMessage] = useState<string>()
    const [email, setEmail] = useState<string>()

    const stripe = useStripe()
    const elements = useElements()

    async function OnsubmitHandler(e: FormEvent) {
        e.preventDefault()
        if (stripe == null || elements == null || email == null) return

        setIsLoading(true)

        // Loyalty opt-in is now its own action via <LoyaltySignupForm/> below -
        // it posts to /api/loyalty/subscribe on its own button, independent of
        // (and never blocking) the payment.

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
                    <div className="mt-4">
                        <LoyaltySignupForm
                            loyaltyEnabled={loyaltyEnabled}
                            consentText={loyaltyConsentText}
                            incentive={loyaltyIncentive}
                        />
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