# Plan: Enforce User Login Before Order Confirmation

**Objective:** Modify the checkout process to require users to be logged in before they can confirm and save an order. Replace the current guest checkout flow with an authenticated flow.

**Affected Files:**

*   `components/cart/useCartSheet.ts` (Main logic changes)
*   `components/providers/AuthProvider.tsx` (Source of auth state)
*   `app/actions/orderActions.ts` (Server action, needs correct arguments)

**Steps:**

1.  **Integrate `useAuth` Hook:**
    *   In `components/cart/useCartSheet.ts`, import `useAuth` from `components/providers/AuthProvider.tsx`.
    *   Call `useAuth()` at the top level of the `useCartSheet` hook to get access to `user`, `profile`, and `isLoading` state.

2.  **Modify `handleConfirmOrder` (Client-Side Auth Check):**
    *   In `useCartSheet.ts`, locate the `handleConfirmOrder` function.
    *   Add `useRouter` hook from `next/navigation`.
    *   Inside the function:
        *   Check `isLoading` from `useAuth`. If true, return early or disable the button.
        *   Check if `user` from `useAuth` is `null`.
        *   If `user` is `null`:
            *   **Do not** call `setIsOrderConfirmed(true)`.
            *   Use `router.push('/auth/login')` to redirect the user.
            *   *(Implementation Note: Consider preserving cart state during redirect, possibly via local storage or URL parameters).*
        *   If `user` exists:
            *   Proceed with `setIsOrderConfirmed(true)`.

3.  **Modify `handleSaveOrder` (Use Auth User ID & Correct Arguments):**
    *   In `useCartSheet.ts`, locate the `handleSaveOrder` function.
    *   Ensure `user` and `profile` from `useAuth` are accessible.
    *   Get the authenticated user's ID: `const authUserId = profile?.id || user?.id;`. Add error handling if `authUserId` is somehow missing.
    *   Prepare `orderItems` array and `totalAmount`.
    *   **Change the server action call:** Replace the existing call with:
        ```javascript
        createOrder(orderItems, authUserId, totalAmount, orderStatus)
        ```
        This passes the correct arguments, including the authenticated user's ID as `customerId`.

4.  **Server Action (`createOrder`):**
    *   No changes are required in `app/actions/orderActions.ts`. The existing logic correctly handles authentication checks and uses the provided `customerId` based on the caller's role.

**Proposed Flow Diagram:**

```mermaid
graph TD
    subgraph CartSheet Component
        A[User in Cart] --> B{Clicks 'Confirm Order'};
        B --> C[CartFooter calls handleConfirmOrder];
    end

    subgraph useCartSheet Hook
        C --> D{handleConfirmOrder};
        D --> E{Call useAuth()};
        E --> F{Check isLoading};
        F -- True --> G[Wait/Disable Button];
        F -- False --> H{Check user === null};
        H -- True --> I[Redirect to /auth/login];
        H -- False --> J[Set isOrderConfirmed = true];
    end

    subgraph CartSheet Component
        J --> L[Render OrderSummary View];
        L --> M{User clicks 'Save Order'};
        M --> N[CartFooter calls handleSaveOrder];
    end

    subgraph useCartSheet Hook
        N --> O{handleSaveOrder};
        O --> P[Get authUserId from useAuth state];
        P --> Q[Prepare orderItems, totalAmount, orderStatus];
        Q --> R[Call createOrder(orderItems, authUserId, totalAmount, orderStatus)];
    end

    subgraph Server Action
        R --> S[createOrder in orderActions.ts];
        S --> T[Action verifies auth, uses authUserId];
        T --> U[Insert order into DB];
        U --> V[Return result];
    end

    subgraph useCartSheet Hook
        V --> W[Handle success/error];
    end
