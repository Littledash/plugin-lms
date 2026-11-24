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
| `renewed` | Only with `renewal`: the user already had the course and a new access period started. |
| `already-renewed` | Only with `renewal`: this purchase key was already applied, so nothing changed. |

It is safe to call twice, so webhook retries do not double-enroll.

## Renewals

When a course has **Access expiration days**, a student's access runs for that many days from
enrollment. Calling `enrollUser` again does not extend it. For a purchase, pass `renewal` with a key
that identifies the purchase, such as the order id:

```typescript
await enrollUser({ req, userId: order.customer, courseId, renewal: { key: String(order.id) } })
```

- Renewed after expiry, access runs for a full period from now.
- Renewed early, the new period is added to the end of the current one, so no paid days are lost.
- The enrollment date is kept, so lessons already released by their delay stay released.

Each key is applied once. A webhook retry, or the browser confirmation and the webhook both
fulfilling the same order, returns `already-renewed` and changes nothing; a new order (a new key)
adds another period. Passing the key on a first purchase is safe too: the student is enrolled and
the key is recorded, so a retry can never count as a renewal. Keys are stored on the student's
progress for that course (`coursesProgress.renewals`).

Two calls with the same key at the same instant are separated by the database transaction: on
MongoDB one of them fails with a write conflict, and retrying it returns `already-renewed`. This
relies on transactions, which MongoDB only supports on a replica set.

## Refunds and disputes

To take a course away after a full refund or a payment dispute, call `unenrollUser` from the
webhook, with the user and courses from your own order record:

```typescript
import { unenrollUser } from '@littledash/plugin-lms/services'

for (const item of order.items) {
  const { groupAccess, status } = await unenrollUser({
    req,
    userId: order.customer,
    courseId: item.course,
    reason: 'refund', // or 'dispute'; stored on the student's progress
  })
}
```

- The student is removed from the course's enrolled and completed students. Lessons, topics,
  quizzes, course files and course materials stop opening at once, and `complete-lesson` and
  `submit-quiz` refuse them.
- Their progress is kept, with `revokedAt` and `revokedReason` set on `coursesProgress`.
- Certificates already awarded are kept, and the student can still download them.
- It returns `unenrolled`, or `not-enrolled` when the student was not on the course, so a webhook
  retry changes nothing. It runs in the transaction of the `req` you pass.
- Groups are not changed. `groupAccess: true` means the student can still open the course through
  a group they lead or belong to. For a refunded group purchase, use `unenrollGroup` (below).

A later purchase restores access: `enrollUser` puts the student back (on the completed list if they
had finished, so the course is not completed or awarded twice), clears the revocation and starts a
new access period. **Pass `renewal: { key }` on every purchase.** A retried fulfilment of the
refunded order then returns `already-renewed` and does not give the course back; without a key,
`enrollUser` cannot tell a retry from a new purchase.

### Group purchases

When the refunded or disputed order bought seats for a group, call `unenrollGroup` with the group
the purchase created (the `groupId` `enrollUser` returned) for each course:

```typescript
import { unenrollGroup } from '@littledash/plugin-lms/services'

const { status, unenrolledUserIds } = await unenrollGroup({
  req,
  groupId: order.group,
  courseId: item.course,
  reason: 'refund',
  keepUserIds: membersWhoAlsoBoughtTheCourse, // optional
})
```

- The group is removed from the course's enrolled groups, and its purchase of the course is marked
  revoked (`purchasedCourses.seatManagement.revokedAt` and `revokedReason`).
- Every leader and student of the group loses the course, including members who joined with the
  coupon or were added by a leader, unless they still have access through another group. Their
  progress is kept and marked revoked; certificates are kept. `unenrolledUserIds` lists them.
- Members in `keepUserIds` are left on the course. Use it for members who also bought the course
  themselves; the plugin cannot tell their own purchase from the group's. Pass the same list on
  every call, since a call without it takes the course from them.
- The purchase's coupon stops working (403 "This group purchase is no longer active."), and members
  added afterwards take no seat on it. The group, its members and its other courses are unchanged.
- It returns `unenrolled`, or `not-enrolled` with no IDs when there was nothing left to remove.

A new purchase by a leader of the same group (`enrollUser` with `group.isLeader`) restores the
purchase with the seats just bought and gives every member the course back. As with individual
purchases, pass `renewal: { key }`, so a retried fulfilment of the refunded group order returns
`already-renewed` and does not restore it.

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

Every other access mode (`buy now`, `recurring`, `closed`) refuses self-enrollment with 403 "This
course requires a purchase." New courses default to `open`, so set the access mode on every course
you sell.

### Refuse self-enrollment in sold courses

If what a course costs is decided elsewhere, for example by your products, add `canSelfEnroll` so a
course left `open` by mistake still cannot be joined for free:

```typescript
import type { CanSelfEnroll } from '@littledash/plugin-lms'

const canSelfEnroll: CanSelfEnroll = async ({ course, req }) =>
  !(await isSoldByPaidProduct(req.payload, String(course.id), req))

lmsPlugin({
  courses: { canSelfEnroll },
})
```

It runs for `POST /api/lms/enroll` (and so `useLMS().enroll`) only after the built-in check has
passed, so it can refuse but never allow a course the access mode refuses. Return `true` to allow;
anything else refuses with the same 403. If it throws, the request fails with a 500 and the user is
not enrolled. Admins are not checked, and server-side `enrollUser` (purchases, coupons, renewals)
does not call it.
