# Security Specification for Family Finance App

## Data Invariants
1. Transactions and Budgets must belong to a Family.
2. A user can only access data if they are a member of that Family document's `members` subcollection.
3. Users cannot change their own roles from the client.
4. Amounts must be positive numbers.

## Dirty Dozen Payloads
1. Attempt to write transaction to a family I'm not a member of.
2. Attempt to read budgets of another family.
3. Attempt to delete a transaction I didn't create (if restriction applies, though families often share).
4. Attempt to change my role to 'admin' in the members collection.
5. Attempt to set an amount to a negative value.
6. Attempt to inject a 2MB string into a transaction title.
7. Attempt to create a transaction without a date.
8. Attempt to spoof `userName` to someone else's.
9. Attempt to create a document with an ID longer than 128 characters.
10. Attempt to update `createdAt` field.
11. Attempt to list all families in the system.
12. Attempt to write to `/families/xxx` without being an admin of that family.

## Test Runner (Drafted in firestore.rules.test.ts)
We will verify that these return PERMISSION_DENIED.
