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
    clientSecret: string
}
export function StripeCheckoutForm(
    { priceInCents, clientSecret

    }: CheckoutFormProps) {
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)


    return (
        <div className=" max-w-5xl mt-3 w-full mx-auto space-y-8 ">
            <PageHeader>Checkout</PageHeader>
            <Elements options={{ clientSecret }} stripe={stripePromise}>
                <Form priceInCents={priceInCents} />
            </Elements>
        </div>
    )

}



function Form({ priceInCents }: { priceInCents: number }) {
    const [isLoading, setIsLoading] = useState(false);
    const [ErrorMessage, setErrorMessage] = useState<string>()
    const [email, setEmail] = useState<string>()



    const stripe = useStripe()
    const elements = useElements()

    async function OnsubmitHandler(e: FormEvent) {
        e.preventDefault()
        console.log('start')
        if (stripe == null || elements == null || email == null) return

        setIsLoading(true)
        console.log('start')



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
            </CardContent>
            <CardFooter>
                <Button className="w-full" variant='mainButton' disabled={isLoading || !stripe || !elements}>
                    {isLoading ? "Purchasing..." : `Purchase - ${formatCurrency(priceInCents / 100)}`}
                </Button>
            </CardFooter>
        </Card>

    </form>

}