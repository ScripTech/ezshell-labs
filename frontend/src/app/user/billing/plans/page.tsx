import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "$0",
    features: [
      "1 Playground Lab",
      "Community Support",
      "Basic Shell Access",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Standard",
    price: "$9.99/mo",
    features: [
      "10 Playground Labs",
      "Priority Support",
      "Advanced Shell Access",
      "Lab History",
    ],
    cta: "Upgrade",
    disabled: false,
  },
  {
    name: "Pro",
    price: "$34.99/mo",
    features: [
      "Unlimited Labs",
      "Premium Support",
      "Full Shell Access",
      "Team Collaboration",
      "Early Access Features",
    ],
    cta: "Upgrade",
    disabled: false,
  },
]

export default function BillingPlansPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Choose Your Plan</h1>
      <div className="flex w-full justify-between items-center mb-6">
        <div className="text-muted-foreground">Billed monthly</div>
        <Button variant="outline">Change Billing Cycle</Button>
      </div>

      <div className="flex w-full">
        <div className="m-auto grid grid-cols-3 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.name} className="flex flex-col w-72 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{plan.price}</div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 mt-4">
                  {plan.features.map(feature => (
                    <li key={feature} className="text-muted-foreground text-sm">• {feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button disabled={plan.disabled} className="w-full">
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
