# OPERATIONAL GUIDELINES
You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.
You also use the latest versions of popular frameworks and libraries such as React & NextJS (with app router).
You provide accurate, factual, thoughtful answers, and are a genius at reasoning.
                
## PRIME DIRECTIVE
	Avoid working on more than one file at a time.
	Multiple simultaneous edits to a file will cause corruption.
	Be chatting and teach about what you are doing while coding.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
	When working with large files (>300 lines) or complex changes:
		1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required
                
            3. Format your plan as:
## PROPOSED EDIT PLAN
	Working with: [filename]
	Total planned edits: [number]

### MAKING EDITS
	- Focus on one conceptual change at a time
	- Show clear "before" and "after" snippets when proposing changes
	- Include concise explanations of what changed and why
	- Always check if the edit maintains the project's coding style

### Edit sequence:
	1. [First specific change] - Purpose: [why]
	2. [Second specific change] - Purpose: [why]
	3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
	4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]
            
### EXECUTION PHASE
	- After each individual edit, clearly indicate progress:
		"✅ Completed edit [#] of [total]. Ready for next edit?"
	- If you discover additional needed changes during editing:
	- STOP and update the plan
	- Get approval before continuing
                
### REFACTORING GUIDANCE
	When refactoring large files:
	- Break work into logical, independently functional chunks
	- Ensure each intermediate state maintains functionality
	- Consider temporary duplication as a valid interim step
	- Always indicate the refactoring pattern being applied
                
### RATE LIMIT AVOIDANCE
	- For very large files, suggest splitting changes across multiple sessions
	- Prioritize changes that are logically complete units
	- Always provide clear stopping points
            
## General Requirements
	Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.

---
applyTo: '**/*'
---

# Frontend Design Guideline

This document summarizes key frontend design principles and rules, showcasing
recommended patterns. Follow these guidelines when writing frontend code.

# Readability

Improving the clarity and ease of understanding code.

## Naming Magic Numbers

**Rule:** Replace magic numbers with named constants for clarity.

**Reasoning:**

- Improves clarity by giving semantic meaning to unexplained values.
- Enhances maintainability.

#### Recommended Pattern:

```typescript
const ANIMATION_DELAY_MS = 300;

async function onLikeClick() {
  await postLike(url);
  await delay(ANIMATION_DELAY_MS); // Clearly indicates waiting for animation
  await refetchPostLike();
}
```

## Abstracting Implementation Details

**Rule:** Abstract complex logic/interactions into dedicated components/HOCs.

**Reasoning:**

- Reduces cognitive load by separating concerns.
- Improves readability, testability, and maintainability of components.

#### Recommended Pattern 1: Auth Guard

(Login check abstracted to a wrapper/guard component)

```tsx
// App structure
function App() {
  return (
    <AuthGuard>
      {" "}
      {/* Wrapper handles auth check */}
      <LoginStartPage />
    </AuthGuard>
  );
}

// AuthGuard component encapsulates the check/redirect logic
function AuthGuard({ children }) {
  const status = useCheckLoginStatus();
  useEffect(() => {
    if (status === "LOGGED_IN") {
      location.href = "/home";
    }
  }, [status]);

  // Render children only if not logged in, otherwise render null (or loading)
  return status !== "LOGGED_IN" ? children : null;
}

// LoginStartPage is now simpler, focused only on login UI/logic
function LoginStartPage() {
  // ... login related logic ONLY ...
  return <>{/* ... login related components ... */}</>;
}
```

#### Recommended Pattern 2: Dedicated Interaction Component

(Dialog logic abstracted into a dedicated `InviteButton` component)

```tsx
export function FriendInvitation() {
  const { data } = useQuery(/* ... */);

  return (
    <>
      {/* Use the dedicated button component */}
      <InviteButton name={data.name} />
      {/* ... other UI ... */}
    </>
  );
}

// InviteButton handles the confirmation flow internally
function InviteButton({ name }) {
  const handleClick = async () => {
    const canInvite = await overlay.openAsync(({ isOpen, close }) => (
      <ConfirmDialog
        title={`Share with ${name}`}
        // ... dialog setup ...
      />
    ));

    if (canInvite) {
      await sendPush();
    }
  };

  return <Button onClick={handleClick}>Invite</Button>;
}
```

## Separating Code Paths for Conditional Rendering

**Rule:** Separate significantly different conditional UI/logic into distinct
components.

**Reasoning:**

- Improves readability by avoiding complex conditionals within one component.
- Ensures each specialized component has a clear, single responsibility.

#### Recommended Pattern:

(Separate components for each role)

```tsx
function SubmitButton() {
  const isViewer = useRole() === "viewer";

  // Delegate rendering to specialized components
  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />;
}

// Component specifically for the 'viewer' role
function ViewerSubmitButton() {
  return <TextButton disabled>Submit</TextButton>;
}

// Component specifically for the 'admin' (or non-viewer) role
function AdminSubmitButton() {
  useEffect(() => {
    showAnimation(); // Animation logic isolated here
  }, []);

  return <Button type="submit">Submit</Button>;
}
```

## Simplifying Complex Ternary Operators

**Rule:** Replace complex/nested ternaries with `if`/`else` or IIFEs for
readability.

**Reasoning:**

- Makes conditional logic easier to follow quickly.
- Improves overall code maintainability.

#### Recommended Pattern:

(Using an IIFE with `if` statements)

```typescript
const status = (() => {
  if (ACondition && BCondition) return "BOTH";
  if (ACondition) return "A";
  if (BCondition) return "B";
  return "NONE";
})();
```

## Reducing Eye Movement (Colocating Simple Logic)

**Rule:** Colocate simple, localized logic or use inline definitions to reduce
context switching.

**Reasoning:**

- Allows top-to-bottom reading and faster comprehension.
- Reduces cognitive load from context switching (eye movement).

#### Recommended Pattern A: Inline `switch`

```tsx
function Page() {
  const user = useUser();

  // Logic is directly visible here
  switch (user.role) {
    case "admin":
      return (
        <div>
          <Button disabled={false}>Invite</Button>
          <Button disabled={false}>View</Button>
        </div>
      );
    case "viewer":
      return (
        <div>
          <Button disabled={true}>Invite</Button> {/* Example for viewer */}
          <Button disabled={false}>View</Button>
        </div>
      );
    default:
      return null;
  }
}
```

#### Recommended Pattern B: Colocated simple policy object

```tsx
function Page() {
  const user = useUser();
  // Simple policy defined right here, easy to see
  const policy = {
    admin: { canInvite: true, canView: true },
    viewer: { canInvite: false, canView: true },
  }[user.role];

  // Ensure policy exists before accessing properties if role might not match
  if (!policy) return null;

  return (
    <div>
      <Button disabled={!policy.canInvite}>Invite</Button>
      <Button disabled={!policy.canView}>View</Button>
    </div>
  );
}
```

## Naming Complex Conditions

**Rule:** Assign complex boolean conditions to named variables.

**Reasoning:**

- Makes the _meaning_ of the condition explicit.
- Improves readability and self-documentation by reducing cognitive load.

#### Recommended Pattern:

(Conditions assigned to named variables)

```typescript
const matchedProducts = products.filter((product) => {
  // Check if product belongs to the target category
  const isSameCategory = product.categories.some(
    (category) => category.id === targetCategory.id
  );

  // Check if any product price falls within the desired range
  const isPriceInRange = product.prices.some(
    (price) => price >= minPrice && price <= maxPrice
  );

  // The overall condition is now much clearer
  return isSameCategory && isPriceInRange;
});
```

**Guidance:** Name conditions when the logic is complex, reused, or needs unit
testing. Avoid naming very simple, single-use conditions.

# Predictability

Ensuring code behaves as expected based on its name, parameters, and context.

## Standardizing Return Types

**Rule:** Use consistent return types for similar functions/hooks.

**Reasoning:**

- Improves code predictability; developers can anticipate return value shapes.
- Reduces confusion and potential errors from inconsistent types.

#### Recommended Pattern 1: API Hooks (React Query)

```typescript
// Always return the Query object
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// Assuming fetchUser returns Promise<UserType>
function useUser(): UseQueryResult<UserType, Error> {
  const query = useQuery({ queryKey: ["user"], queryFn: fetchUser });
  return query;
}

// Assuming fetchServerTime returns Promise<Date>
function useServerTime(): UseQueryResult<Date, Error> {
  const query = useQuery({
    queryKey: ["serverTime"],
    queryFn: fetchServerTime,
  });
  return query;
}
```

#### Recommended Pattern 2: Validation Functions

(Using a consistent type, ideally a Discriminated Union)

```typescript
type ValidationResult = { ok: true } | { ok: false; reason: string };

function checkIsNameValid(name: string): ValidationResult {
  if (name.length === 0) return { ok: false, reason: "Name cannot be empty." };
  if (name.length >= 20)
    return { ok: false, reason: "Name cannot be longer than 20 characters." };
  return { ok: true };
}

function checkIsAgeValid(age: number): ValidationResult {
  if (!Number.isInteger(age))
    return { ok: false, reason: "Age must be an integer." };
  if (age < 18) return { ok: false, reason: "Age must be 18 or older." };
  if (age > 99) return { ok: false, reason: "Age must be 99 or younger." };
  return { ok: true };
}

// Usage allows safe access to 'reason' only when ok is false
const nameValidation = checkIsNameValid(name);
if (!nameValidation.ok) {
  console.error(nameValidation.reason);
}
```

## Revealing Hidden Logic (Single Responsibility)

**Rule:** Avoid hidden side effects; functions should only perform actions
implied by their signature (SRP).

**Reasoning:**

- Leads to predictable behavior without unintended side effects.
- Creates more robust, testable code through separation of concerns (SRP).

#### Recommended Pattern:

```typescript
// Function *only* fetches balance
async function fetchBalance(): Promise<number> {
  const balance = await http.get<number>("...");
  return balance;
}

// Caller explicitly performs logging where needed
async function handleUpdateClick() {
  const balance = await fetchBalance(); // Fetch
  logging.log("balance_fetched"); // Log (explicit action)
  await syncBalance(balance); // Another action
}
```

## Using Unique and Descriptive Names (Avoiding Ambiguity)

**Rule:** Use unique, descriptive names for custom wrappers/functions to avoid
ambiguity.

**Reasoning:**

- Avoids ambiguity and enhances predictability.
- Allows developers to understand specific actions (e.g., adding auth) directly
  from the name.

#### Recommended Pattern:

```typescript
// In httpService.ts - Clearer module name
import { http as httpLibrary } from "@some-library/http";

export const httpService = {
  // Unique module name
  async getWithAuth(url: string) {
    // Descriptive function name
    const token = await fetchToken();
    return httpLibrary.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// In fetchUser.ts - Usage clearly indicates auth
import { httpService } from "./httpService";
export async function fetchUser() {
  // Name 'getWithAuth' makes the behavior explicit
  return await httpService.getWithAuth("...");
}
```

# Cohesion

Keeping related code together and ensuring modules have a well-defined, single
purpose.

## Considering Form Cohesion

**Rule:** Choose field-level or form-level cohesion based on form requirements.

**Reasoning:**

- Balances field independence (field-level) vs. form unity (form-level).
- Ensures related form logic is appropriately grouped based on requirements.

#### Recommended Pattern (Field-Level Example):

```tsx
// Each field uses its own `validate` function
import { useForm } from "react-hook-form";

export function Form() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    /* defaultValues etc. */
  });

  const onSubmit = handleSubmit((formData) => {
    console.log("Form submitted:", formData);
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input
          {...register("name", {
            validate: (value) =>
              value.trim() === "" ? "Please enter your name." : true, // Example validation
          })}
          placeholder="Name"
        />
        {errors.name && <p>{errors.name.message}</p>}
      </div>
      <div>
        <input
          {...register("email", {
            validate: (value) =>
              /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
                ? true
                : "Invalid email address.", // Example validation
          })}
          placeholder="Email"
        />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Recommended Pattern (Form-Level Example):

```tsx
// A single schema defines validation for the whole form
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Please enter your name."),
  email: z.string().min(1, "Please enter your email.").email("Invalid email."),
});

export function Form() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = handleSubmit((formData) => {
    console.log("Form submitted:", formData);
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input {...register("name")} placeholder="Name" />
        {errors.name && <p>{errors.name.message}</p>}
      </div>
      <div>
        <input {...register("email")} placeholder="Email" />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Guidance:** Choose **field-level** for independent validation, async checks,
or reusable fields. Choose **form-level** for related fields, wizard forms, or
interdependent validation.

## Organizing Code by Feature/Domain

**Rule:** Organize directories by feature/domain, not just by code type.

**Reasoning:**

- Increases cohesion by keeping related files together.
- Simplifies feature understanding, development, maintenance, and deletion.

#### Recommended Pattern:

(Organized by feature/domain)

```
src/
├── components/ # Shared/common components
├── hooks/      # Shared/common hooks
├── utils/      # Shared/common utils
├── domains/
│   ├── user/
│   │   ├── components/
│   │   │   └── UserProfileCard.tsx
│   │   ├── hooks/
│   │   │   └── useUser.ts
│   │   └── index.ts # Optional barrel file
│   ├── product/
│   │   ├── components/
│   │   │   └── ProductList.tsx
│   │   ├── hooks/
│   │   │   └── useProducts.ts
│   │   └── ...
│   └── order/
│       ├── components/
│       │   └── OrderSummary.tsx
│       ├── hooks/
│       │   └── useOrder.ts
│       └── ...
└── App.tsx
```

## Relating Magic Numbers to Logic

**Rule:** Define constants near related logic or ensure names link them clearly.

**Reasoning:**

- Improves cohesion by linking constants to the logic they represent.
- Prevents silent failures caused by updating logic without updating related
  constants.

#### Recommended Pattern:

```typescript
// Constant clearly named and potentially defined near animation logic
const ANIMATION_DELAY_MS = 300;

async function onLikeClick() {
  await postLike(url);
  // Delay uses the constant, maintaining the link to the animation
  await delay(ANIMATION_DELAY_MS);
  await refetchPostLike();
}
```

_Ensure constants are maintained alongside the logic they depend on or clearly
named to show the relationship._

# Coupling

Minimizing dependencies between different parts of the codebase.

## Balancing Abstraction and Coupling (Avoiding Premature Abstraction)

**Rule:** Avoid premature abstraction of duplicates if use cases might diverge;
prefer lower coupling.

**Reasoning:**

- Avoids tight coupling from forcing potentially diverging logic into one
  abstraction.
- Allowing some duplication can improve decoupling and maintainability when
  future needs are uncertain.

#### Guidance:

Before abstracting, consider if the logic is truly identical and likely to
_stay_ identical across all use cases. If divergence is possible (e.g.,
different pages needing slightly different behavior from a shared hook like
`useOpenMaintenanceBottomSheet`), keeping the logic separate initially (allowing
duplication) can lead to more maintainable, decoupled code. Discuss trade-offs
with the team. _[No specific 'good' code example here, as the recommendation is
situational awareness rather than a single pattern]._

## Scoping State Management (Avoiding Overly Broad Hooks)

**Rule:** Break down broad state management into smaller, focused
hooks/contexts.

**Reasoning:**

- Reduces coupling by ensuring components only depend on necessary state slices.
- Improves performance by preventing unnecessary re-renders from unrelated state
  changes.

#### Recommended Pattern:

(Focused hooks, low coupling)

```typescript
// Hook specifically for cardId query param
import { useQueryParam, NumberParam } from "use-query-params";
import { useCallback } from "react";

export function useCardIdQueryParam() {
  // Assuming 'query' provides the raw param value
  const [cardIdParam, setCardIdParam] = useQueryParam("cardId", NumberParam);

  const setCardId = useCallback(
    (newCardId: number | undefined) => {
      setCardIdParam(newCardId, "replaceIn"); // Or 'push' depending on desired history behavior
    },
    [setCardIdParam]
  );

  // Provide a stable return tuple
  return [cardIdParam ?? undefined, setCardId] as const;
}

// Separate hook for date range, etc.
// export function useDateRangeQueryParam() { /* ... */ }
```

Components now only import and use `useCardIdQueryParam` if they need `cardId`,
decoupling them from date range state, etc.

## Eliminating Props Drilling with Composition

**Rule:** Use Component Composition instead of Props Drilling.

**Reasoning:**

- Significantly reduces coupling by eliminating unnecessary intermediate
  dependencies.
- Makes refactoring easier and clarifies data flow in flatter component trees.

#### Recommended Pattern:

```tsx
import React, { useState } from "react";

// Assume Modal, Input, Button, ItemEditList components exist

function ItemEditModal({ open, items, recommendedItems, onConfirm, onClose }) {
  const [keyword, setKeyword] = useState("");

  // Render children directly within Modal, passing props only where needed
  return (
    <Modal open={open} onClose={onClose}>
      {/* Input and Button rendered directly */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)} // State managed here
          placeholder="Search items..."
        />
        <Button onClick={onClose}>Close</Button>
      </div>
      {/* ItemEditList rendered directly, gets props it needs */}
      <ItemEditList
        keyword={keyword} // Passed directly
        items={items} // Passed directly
        recommendedItems={recommendedItems} // Passed directly
        onConfirm={onConfirm} // Passed directly
      />
    </Modal>
  );
}

// The intermediate ItemEditBody component is eliminated, reducing coupling.
```

## Key Principles
- Focus on readability over being performant.
- Fully implement all requested functionality.
- Leave NO todo's, placeholders or missing pieces.
- Be sure to reference file names.
- Be concise. Minimize any other prose.
- If you think there might not be a correct answer, you say so. If you do not know the answer, say so instead of guessing.
- Only write code that is necessary to complete the task.
- Rewrite the complete code only if necessary.
- Update relevant tests or create new tests if necessary.

## Naming Conventions
- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.

## UI and Styling
- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.

## Performance Optimization
- Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
- Wrap client components in Suspense with fallback.
- Use dynamic loading for non-critical components.
- Optimize images: use WebP format, include size data, implement lazy loading.

## Next.js (App Router)
- This project uses Next.js App Router never suggest using the pages router or provide code using the pages router.
- Use the **App Router**, **Server Components**, and **Route Handlers** where appropriate.
- Prefer `server actions` for mutation logic when client interactivity is not required.
- Use `Image` from `next/image` for images to benefit from optimization.
- Place route handlers inside `app/api/` for API endpoints.

## State Management (Zustand)
- Use **Zustand** for local/global client state.
- Structure stores in `stores/` and ensure modular, testable state slices.
- Avoid redundant global state if props/context/state hooks are sufficient.

## Error Handling
- Use `try/catch` for async operations both server and client side.
- Handle api errors gracefully using `onError`.
- Show user-friendly error messages via UI state.

## Authentication (NextAuth.js)
- Use credentials or OAuth providers with `next-auth`.
- Access the current session via `getServerSession` or `useSession()` on the client.
- Protect server routes and procedures based on roles or permissions.

## Anti-Patterns
- ❌ Do not use `any` type.
- ❌ Do not bypass tRPC or ORM types.
- ❌ Do not duplicate logic across client/server.
- ❌ Do not store sensitive logic on the client.
