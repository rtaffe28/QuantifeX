# Transactions Frontend Spec

## Context
The `Transactions` model already exists in the backend (`backend/core/models/transactions.py`) with fields: `id`, `user`, `date`, `type`, `description`, and `amount`. However, there are no API endpoints, serializers, or frontend components for transactions yet. This spec covers building the full stack from API to UI.

## Goal
Add a transactions page that displays a table of the user's transactions and a PnL summary (sum of amounts) at the top.

---

## 1. Backend — API Endpoints

Follow the existing Watchlist pattern (serializer + class-based DRF views).

### Files to create/modify:

**Create `backend/core/serializers/transactions.py`**
- `TransactionsSerializer(ModelSerializer)` with all fields; `user` as read-only

**Create `backend/core/views/transactions.py`**
- `TransactionsList(generics.ListCreateAPIView)` — GET list / POST create, filtered by `request.user`, permission `IsAuthenticated`
- `TransactionsDelete(generics.DestroyAPIView)` — DELETE by pk, filtered by `request.user`

**Modify `backend/core/serializers/__init__.py`**
- Export `TransactionsSerializer`

**Modify `backend/core/views/__init__.py`**
- Export `TransactionsList`, `TransactionsDelete`

**Modify `backend/core/urls.py`**
- `api/transactions/` → `TransactionsList`
- `api/transactions/delete/<int:pk>/` → `TransactionsDelete`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/transactions.ts`**
Follow the `watchlist.ts` pattern:
- `getTransactions()` — GET `/transactions/`
- `addTransaction(data)` — POST `/transactions/`
- `deleteTransaction(id)` — DELETE `/transactions/delete/{id}/`

---

## 3. Frontend — TypeScript Model

**Create `frontend/quantifex_fe/src/models/Transaction.ts`**
```ts
export interface Transaction {
  id: number;
  user: number;
  date: string;
  type: string;
  description: string;
  amount: number;
}
```

---

## 4. Frontend — Transactions Page Component

**Create `frontend/quantifex_fe/src/components/TransactionsTable.tsx`**

### Layout
```
┌─────────────────────────────────────────┐
│  Total PnL:  $X,XXX.XX     (green/red) │
├─────────────────────────────────────────┤
│  Date  │ Type │ Description │  Amount   │
│────────┼──────┼─────────────┼───────────│
│  ...   │ ...  │    ...      │   ...     │
│  ...   │ ...  │    ...      │   ...     │
└─────────────────────────────────────────┘
```

### Details
- **PnL Card**: Display sum of all `amount` values. Green text if positive, red if negative. Use Chakra UI `Stat` or a simple `Box` with styled text.
- **Table**: Use Chakra UI's `Table` component (`Table.Root`, `Table.Header`, `Table.Body`, `Table.Row`, `Table.Cell`). Columns: Date, Type, Description, Amount.
- **Amount formatting**: USD currency format, color-coded (green for positive, red for negative).
- **Date formatting**: Display as `MM/DD/YYYY` or locale string.
- **Loading state**: Show a `Spinner` while fetching.
- **Empty state**: "No transactions yet" message when the list is empty.
- Fetch transactions on mount via `getTransactions()`.

---

## 5. Frontend — Routing & Navigation

**Modify `frontend/quantifex_fe/src/App.tsx`**
- Add route `/transactions` as a child of `/`, wrapped in `ProtectedRoute`

**Modify `frontend/quantifex_fe/src/components/Sidebar.tsx`**
- Add `{ to: "/transactions", label: "Transactions" }` to `navLinks`

---

## 6. Verification
1. Run Django backend, confirm `GET /api/transactions/` returns `200` with auth token
2. Navigate to `/transactions` in the browser — should see the table and PnL summary
3. Add a transaction via Django admin or POST request, confirm it appears in the table
4. Confirm PnL total updates correctly (positive = green, negative = red)
