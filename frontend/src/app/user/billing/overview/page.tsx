"use client"

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BillingOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-4">
        <div className="bg-muted px-4 py-3 rounded text-sm">
          For more information on using these billing pages please refer to the docs content <a href="#" className="underline">here</a>.
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle>Current metered usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-muted-foreground text-sm mt-2">Showing gross metered usage for your account.</div>
          </CardContent>
        </Card>
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle>
              Current included usage
              <span className="ml-2 text-xs text-muted-foreground">More details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-muted-foreground text-sm mt-2">Showing currently applied discounts for your account.</div>
          </CardContent>
        </Card>
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle>
              Next payment due
              <Link href="#" className="ml-2 text-xs underline">Payment history</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mb-2">Subscriptions</h3>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">$0.00 <span className="text-base font-normal">per month</span></div>
          </CardContent>
        </Card>
      </div>
      <div className="mb-8 text-right">
        {/* <Link href="#" className="underline text-sm">Manage subscriptions</Link> */}
      </div>

      <h3 className="text-lg font-semibold mb-2">Metered usage</h3>
      <Card className="shadow-none rounded-md">
        <CardHeader>
          <CardTitle>Jul 1 - Jul 31, 2025</CardTitle>
          <div className="mt-2">
            <Button variant="outline" size="sm">Time Frame: Current month</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder for usage chart */}
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Usage chart coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
