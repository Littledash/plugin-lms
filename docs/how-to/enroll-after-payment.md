# How to enroll a user after a payment

Paid courses (`buy now`, `recurring`, `closed`) cannot be enrolled in over HTTP. Enroll the buyer
on the server once your payment provider confirms the payment.

## 1. Verify the payment

Use your provider's signed webhook, never a client-side "payment succeeded" call. With Stripe:

```typescript
import type { Endpoint } from 'payload'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const stripeWebhook: Endpoint = {
  path: '/stripe/webhook',
  method: 'post',
  handler: async (req) => {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text!()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return Response.json({ message: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      await fulfilOrder({ req, session: event.data.object })
    }
    return Response.json({ received: true })
  },
}
```

## 2. Enroll with the service

Take the user and courses from your own order record, not from webhook metadata a client could set.

```typescript
import type { PayloadRequest } from 'payload'
import { enrollUser, LMSError } from '@littledash/plugin-lms/services'

const fulfilOrder = async ({ req, session }: { req: PayloadRequest; session: Stripe.Checkout.Session }) => {
  const { docs } = await req.payload.find({
    collection: 'orders',
    where: { stripeSessionId: { equals: session.id } },
    limit: 1,
    req,
  })
  const order = docs[0]
  if (!order || order.status === 'fulfilled') return

  for (const item of order.items) {
    const result = await enrollUser({ req, userId: order.customer, courseId: item.course })
    req.payload.logger.info(`Order ${order.id}: course ${item.course} ${result.status}`)
  }

  await req.payload.update({ collection: 'orders', id: order.id, data: { status: 'fulfilled' }, req })
}
```

`enrollUser` returns a `status`:

| Status | Meaning |
| --- | --- |
| `enrolled` | The user was added to the course and their progress initialised. |
| `already-enrolled` | Nothing to do; progress is created if it was missing. |
| `already-completed` | The user already finished this course. |

It is safe to call twice, so webhook retries do not double-enroll.

## 3. Group purchases

Pass `group` to enroll the buyer as the group's leader. See
[Groups and seats](./groups-and-seats.md) for how members join afterwards.

```typescript
await enrollUser({
  req,
  userId: order.customer,
  courseId: item.course,
  group: {
    companyName: order.companyName, // title of a new group
    isLeader: true,
    totalSeats: item.quantity,
    couponId: order.groupCoupon, // members join with this coupon
  },
})
```

## Transactions

Pass the incoming `req`. The service then runs inside that request's transaction, and a failure
rolls back every write, including your own writes made with the same `req`. Without a `req` (for
example in a script), pass `{ payload } as PayloadRequest` and the service opens its own
transaction.

## Errors

Services throw `LMSError` with a `status` and a message that is safe to show:

```typescript
try {
  await enrollUser({ req, userId, courseId })
} catch (error) {
  if (error instanceof LMSError) {
    req.payload.logger.warn(`Enrollment refused (${error.status}): ${error.message}`)
  } else {
    throw error
  }
}
```

## Free and open courses

Users can enroll themselves in `open` and `free` courses from the browser:

```tsx
const { enroll } = useLMS()
await enroll(course.id)
```
