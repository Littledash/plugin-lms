# How to sell courses to groups

A group is a company or team that buys seats on one or more courses. Leaders manage the group;
students take the courses.

## Data model

| Field | Meaning |
| --- | --- |
| `leaders`, `students` | Members. Both get access to the group's courses. |
| `purchasedCourses[].seatManagement` | One entry per course bought: `course`, `seatsTotal`, `seatsUsed`, and the `coupon` members join with. |
| `courses.courseEnrolledGroups` | The groups enrolled in a course. |

Every member, leader or student, uses one seat.

## 1. The leader buys seats

After the payment is verified, enroll the buyer as leader. This creates the group, records the
purchase and gives the buyer the `leader` role.

```typescript
import { enrollUser } from '@littledash/plugin-lms/services'

const { groupId } = await enrollUser({
  req,
  userId: order.customer,
  courseId,
  group: { companyName: 'Acme Pty Ltd', isLeader: true, totalSeats: 10, couponId: groupCoupon.id },
})
```

The group is matched in this order:

1. The group that bought this course with `couponId`.
2. A group the buyer already leads (with the same title when `companyName` is given). Use this
   when a leader buys another course or more seats.
3. Otherwise a new group titled `companyName`.

A group is never joined because its title matches. Two companies can share a name.

## 2. Members join

**With the group coupon.** When a member redeems the coupon at checkout, enroll them with the same
`couponId` and `isLeader: false`. They join the group and use a seat.

```typescript
await enrollUser({
  req,
  userId: member.id,
  courseId,
  group: { couponId: groupCoupon.id, isLeader: false },
})
```

**Added by a leader.** A leader can add an existing user from the browser:

```typescript
const { addUserToGroup } = useLMS()
await addUserToGroup(groupId, memberId, 'student')
```

The endpoint checks that the requester is an admin or a leader of that group.

## Seat limits

Adding a member fails with `409 This group has no seats remaining` when `seatsUsed` has reached
`seatsTotal`:

- for coupon enrollment, on the course being joined
- for `add-user-to-group`, on any course the group bought (the member uses a seat on each)

To sell more seats, increase `seatsTotal` on the purchase in the admin panel or in your fulfilment
code.

## Access

Group members are enrolled for access checks: content fields and the completion endpoints treat a
member of a group in `courseEnrolledGroups` as enrolled.

To let members read their group and leaders edit it, use the plugin's access functions:

```typescript
import { isAdminOrGroupLeader, isMemberOfGroup } from '@littledash/plugin-lms/access'

groups: {
  groupsCollection: {
    access: {
      create: isAdminOrGroupLeader,
      read: isMemberOfGroup,
      update: isAdminOrGroupLeader,
      delete: isAdminOrGroupLeader,
    },
  },
}
```
