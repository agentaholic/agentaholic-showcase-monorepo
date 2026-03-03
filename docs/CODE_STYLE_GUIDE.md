TODO:

- Add table of contents

- Sort rules such that similar rules are grouped together, and the most essential rules are towards the top

- rule which explains that devs should:
  - 1. configure their editor to auto-format with Prettier

  - 2. configure an ESLint extension

  - 3. write code that complies with the existing ESLint rules

- rule for preferring early returns over nested if/else chains

- rule: Use `== null` instead of `=== undefined`

- rule: Avoid `// TODO` comments unless they have a URL referencing the task manager

- rule: when pulling values from the environment or a secret store, preserve the variable name verbatim

# Avoid magic numbers

Avoid using literal numeric values directly in code without explanation. Instead, use named constants or objects that clearly indicate the purpose and meaning of the number.

```ts
// undesired
setTimeout(callback, 5000)
if (user.loginAttempts > 3) {
  blockUser(user)
}
const pagination = { limit: 20, offset: page * 20 }

// desired
const loginTimeout = { milliseconds: 5000 }
setTimeout(callback, loginTimeout.milliseconds)

const maxLoginAttempts = 3
if (user.loginAttempts > maxLoginAttempts) {
  blockUser(user)
}

const pageSize = 20
const pagination = { limit: pageSize, offset: page * pageSize }
```

> _Why?_
>
> Magic numbers make code harder to understand and maintain. When encountering a literal number in code, it's often unclear what the number represents, what unit it's in, or why that specific value was chosen. Named constants provide context and make the code self-documenting. Additionally, using named constants makes it easier to update values consistently across the codebase.

# Prefer nested key references

Whenever referencing a value the property of something, instead of using flat variable names like "integratorName", "namespaceSlug", "aggregateId", "databaseUrl", store an object with that property as a key on the object such as "integrator.name", "namespace.slug", "aggregate.id", "database.url" respectively.

For example:

- Instead of `const bankId = 123`, use `const bank = { id: 123 }`
- Instead of `const integratorName = "example"`, use `const integrator = { name: "example" }`
- Instead of `const namespaceSlug = "my-namespace"`, use `const namespace = { slug: "my-namespace" }`

However, sometimes you cannot store an entire object, such as in database columns. In such cases, you'll need to use the full variable name without nesting a key within an object.

Also be careful to avoid doing this for variable names that use the prefix to indicate that the value pertains to a specific context/domain and not a "thing" per se, such as "stripeId", "githubAccessToken", "postgresScheme". These should remain as flat variables since they represent domain-specific identifiers rather than properties of domain entities.

## Prefer nested key references: Use `thin`, `thinner`, `thinnest` prefixes when progressively obtaining additional keys

When following this pattern, you will often have redundant values where the same "thing" is referenced by multiple values, and each value has a superset of keys of the previously used value. In these instances, leave the original name for the last/thickest value, and the name of each previous value should be prefixed with "thin," "thinner," and "thinnest" to signify that it holds a subset of keys.

For example you might have a function that takes a reference to a user as `{ id: string }` and then during the invocation of that function it fetches a user row from the database which contains `{ id: string, name: string, email: string, profile: { id: string } }` and after that it also queries a nullable profile row. The code for this could look like:

```ts
const getUser = async (params: { user: { id: string } }) => {
  const { user: thinnerUser } = params

  const thinUser = await loadUserAggregate({ user: thinnerUser })

  const { profile: thinProfile } = thinUser

  const profile = await loadProfileAggregate({ profile: thinProfile })

  const user = { ...thinUser, profile }

  return user
}
```

# Naming numeric durations

When representing a duration of time with a number, such as a number of milliseconds, seconds, hours, etc. use an object with a key that indicates unit is being counted by the number’s value. Ideally, use key names that match the format expected by [Luxon’s `Duration.fromObject` function](https://moment.github.io/luxon/api-docs/index.html#durationfromobject).

```ts
// undesired
const delay = 5000
const timeout = 30
const interval = 60

// desired
const delay = { milliseconds: 5000 }
const timeout = { seconds: 30 }
const interval = { minutes: 1 }

// also acceptable with Luxon format
const cacheExpiry = { hours: 24 }
const retryDelay = { milliseconds: 500 }
```

> _Why?_
>
> Without indicating the unit, it is unclear what unit is being used without
> context, and additionally it can be unclear that the value is even a duration.

When representing a duration of time with Luxon’s duration object, prefer to postfix the name with `Duration` to indicate that the value is an instance of the duration object.

```ts
// undesired
const delay = Duration.fromObject({ milliseconds: 5000 })
const timeout = Duration.fromObject({ seconds: 30 })

// desired
const delayDuration = Duration.fromObject({ milliseconds: 5000 })
const timeoutDuration = Duration.fromObject({ seconds: 30 })

// usage example
await new Promise((resolve) => setTimeout(resolve, delayDuration.toMillis()))
```

> _Why?_
>
> Postfixing names with `Duration` makes it clear that this variable is an
> instance of a duration and helps to distinguish between other cases where the
> same conceptual value is being referred to with a different type.

# Naming fields and values: Avoid tense-based and verb-based naming for booleans

Resist the tendency to use tense-based names for boolean values. Instead use tense-less adjective attribute-style names when possible.

```ts
// undesired
const isLoading = true

// desired
const loading = true

// undesired
const hasAccessToken = true

// improved
const accessTokenObtained = true
const accessTokenProvided = true
const accessTokenPresent = true

// desired - follows nested foreign key principle
const accessToken = { present: true }
const present = true

// undesired
const user = { canViewPrivateContent: true }

// desired
const user = { privateContentViewingPriviledgeGranted: true }

// undesired
const canSkipVerification = true
const allowedToSkipVerification = true

// desired
const skippingVerificationAllowed = true
const verificationSkippable = true

// desired - most specific
const verificationSkippingPermissionGranted = true
const verificationSkippingEligibility = { eligible: true }
```

Caveat: this rule applies to variable names and field names, but not getter functions. Getter functions are verb-based, so names like `isValid` are not breaking this rule.

> _Why?_
>
> Within the JavaScript and TypeScript ecosystem, it is more common to see verb-less tense-less variable names. Additionally, this convention helps to improve consistency in naming when also storing timestamps such as `createdAt`, `updatedAt`, `validatedAt` which are able to follow the same convention.
>
> Additionally, expressions that use the negation operator read more like plain-English. Compare "valid and not created" to "is valid and not is created." The latter example diverges further from grammatically-correct English than what is desirable.

# Naming fields and values: Avoid abbreviations, truncations and aliasing

Resist the tendency to use shortened or abbreviated names for variables, functions, and types. Use full, descriptive names that clearly communicate the purpose and meaning of the value.

```ts
// undesired
const usr = await getUser()
const cfg = loadConfig()
const db = connectDatabase()
const auth = authenticate()
const req = request
const res = response
const btn = document.querySelector('button')
const img = loadImage()

// desired
const user = await getUser()
const config = loadConfig()
const database = connectDatabase()
const authentication = authenticate()
const request = request
const response = response
const button = document.querySelector('button')
const image = loadImage()

// undesired function names
const getUserById = (id) => {
  /* */
}
const delUser = (id) => {
  /* */
}
const updUser = (id, data) => {
  /* */
}

// desired function names
const getUserById = (id) => {
  /* */
}
const deleteUser = (id) => {
  /* */
}
const updateUser = (id, data) => {
  /* */
}
```

> _Why?_
>
> Abbreviated names require additional mental processing to understand their meaning, especially for developers who are new to the codebase or returning after time away. Full names make the code self-documenting and reduce the cognitive load required to understand what each variable represents. Modern IDEs provide excellent autocompletion, so the extra typing burden of longer names is minimal.

# Naming fields and values: Prefer names that have a semantic meaning

Similar to avoiding abbreviations, avoid using modifiers on names that don't indicate any semantic meaning. For example, in most contexts, `sellerRow` indicates that this value contains data from a _database row_, which is different from other possible sources such as an HTTP API, an aggregate or an event. In contrast, `sellerInfo` doesn't indicate anything more useful than simply `seller` because "info" doesn't actually semantically pertain to anything and so it is ambiguous as to what is different between a `seller` variable and a `sellerInfo` variable.

```ts
// undesired - modifiers without semantic meaning
const userInfo = await fetchUser()
const orderData = processOrder()
const productDetails = getProduct()
const customerStuff = loadCustomer()
const configOptions = loadConfig()

// desired - specific semantic meaning
const userProfile = await fetchUserProfile()
const userAccount = await fetchUserAccount()
const orderTransaction = processOrderTransaction()
const orderSummary = generateOrderSummary()
const productCatalogEntry = getProductFromCatalog()
const productInventoryRecord = getProductInventory()
const customerAggregate = loadCustomerAggregate()
const customerPreferences = loadCustomerPreferences()
const applicationConfig = loadApplicationConfig()
const featureFlags = loadFeatureFlags()

// acceptable - clear semantic distinction
const userRow = await database.users.findById(id) // from database
const userResponse = await api.users.get(id) // from HTTP API
const userAggregate = await loadUserAggregate({ user: { id } }) // from event store
```

> _Why?_
>
> Generic modifiers like "info", "data", "details", "stuff", and "options" don't provide meaningful distinction between different representations of the same conceptual entity. They add noise without adding clarity. When modifiers are used, they should indicate something specific about the source, format, or purpose of the data that helps distinguish it from other related values in the same context.

# Naming fields and values: Avoid using negated meanings for booleans

Ensure that `true` semantically means a positive non-negated non-void state and vice versa for `false`.

```ts
// undesired
const disabled = true
const missing = true
const empty = true
const disallowed = true
const blocked = true

// desired
const enabled = false
const present = false
const populated = false
const nonEmpty = false
const allowed = false
const unblocked = false
```

> _Why?_
>
> When a developer is first glancing at a boolean value, the value of `true` or `false` is what is cognitively perceived first, and the name and meaning of the field comes after. It is easy to get confused about whether a `true` means a positive non-void state (and vice-versa, whether a `false` means a negative void state) in an abstract sense if the developer is expected to mentally invert the value. This problem becomes exacerbated in the context where multiple boolean fields and values are next to each other.

# Designing modules: Prefer one canonical exported member per module

Avoid writing modules that export many equally-important or similar members. However, second-tier or auxiliary members are fine when they are closed coupled to the default export.

Undesirable:

- `utils.ts` which exports `convertId`, `generateId`, `validateId`
- `hooks.ts` which exports `useOrder`, `useConfig`
- `users.ts` which exports `createUser`, `deleteUser`, `getUser`
- `createUser.ts` which exports `createUser` but also `deleteUser` and `getUser` which are similar and equally important
- `types.ts` which exports `User`, `Token`, `Order`

Desirable:

- `utils/convertId.ts` which exports `convertId`
- `utils/generateId.ts` which exports `generateId`
- `utils/validateId.ts` which exports `validateId`
- `hooks/useOrder.ts` which exports `useOrder`
- `hooks/useConfig.ts` which exports `useConfig`
- `users/api/createUser.ts` which exports `createUser` and auxiliary types: `CreateUserRequest`, `CreateUserResponse`
- `users/api/deleteUser.ts` which exports `deleteUser` and auxiliary types: `DeleteUserRequest`, `DeleteUserResponse`
- `users/api/getUser.ts` which exports `getUser` and auxiliary types: `GetUserRequest`, `GetUserResponse`
- `types/User.ts` which exports `User` and auxiliary types: `UserRole`, etc.
- `types/Token.ts` which exports `Token`
- `types/Order.ts` which exports `Order` and auxiliary types: `OrderStatus`, etc.

> _Why?_
>
> When encountering a module with a generic name like `utils` or `users` or `types`, then useful information about the contents of the module is not being conveyed. Instead, when there is only one primary member and the module name reflects it, then the module name is able to convey exactly what the module is responsible for. This makes it easier to navigate through a project and understand where different pieces of logic really live. When an important function is mixed in with a bunch of other functions in a module with a generic name, then it essentially goes unnoticed by those who are browsing the file structure of the repository. With a generically-named module, there's no way to know if the module contains large and important pieces of logic, or if it simply contains a minimal amount of unimportant logic, and the codebase becomes more difficult to quickly navigate as a result.
>
> Additionally, allowing multiple equally-important members to be contained in the same file leads to bigger problems as a codebase grows larger and larger. What ends up happening is that more code gets lumped into that module over time and it becomes an undesirably-long file. Many developers use scrolling to navigate through their files and don't have effective ways to navigate and work on many different areas within the same file. Because of this, it is preferable to split up code into as many smaller files as possible so that navigating between areas of the code is as simple as switching tabs instead of requiring imprecise scrolling and the cognitive load that it entails (however it is worth noting that there are techniques for working within arbitrarily-large files that avoid some of these disadvantages, such as using VIM with split windows and navigating through searches instead of scrolling).
>
> Furthermore, when individual pieces of logic are isolated to their own files, it becomes much easier to quickly navigate and find that piece of logic via common fuzzy-finding like the Cmd+P shortcut in VSCode (in VIM, popular plugins for this feature include `fzf.vim` and `CtrlP.vim`) because you can type the name of the file directly. For example, if you see some code that is calling a `convertId` function, then assuming your file names match your exported members, you can simply use fuzzy-find to search for `convertId` instead of needing to go and look at where it is getting imported or worse, grepping the codebase to find it.

# Designing modules: Avoid default exports for canonical exported member

Avoid writing modules with the `default` keyword. Instead, export your canonical member as named member.

```ts
// undesirable
const App = (): JSX.Element => {
  return (
    <div>Hello world!</div>
  )
}

export default App
```

```ts
// desirable
export const App = (): JSX.Element => {
  return (
    <div>Hello world!</div>
  )
}
```

> _Why?_
>
> Using the default export loses the guarantee that downstream modules will use the same member name to reference the export, which leads to a potential for inconsistency throughout the codebase. When the same name is used everywhere, it makes it easier to grep your codebase, and it also makes it easier for AI to understand what is going on in your code.
>
> Other benefits include better autocompletion behaviors, safer refactoring and better compatibility with CommonJS.

# Naming files: Prefer to name modules after their exported member

When possible, name your module in camel case and have it match the name of canonically-default exported member.

Undesirable:

- `validation.ts` exports a function named `validate`
- `create.ts` exports a function named `createUser`
- `UserService.ts` exports a function named `makeUserService`

Desirable:

- `validate.ts` exports a function named `validate`
- `createUser.ts` exports a function named `createUser`
- `makeUserService` exports a function named `makeUserService`

> _Why?_
>
> The core advantage here is that developers can reliably use filename-based search tools to find the module that contains any given resource whenever encountering that in downstream code.
>
> Additionally, this creates more predictability in naming. Having filenames that don't match their exports leads to more cognitive dissonance and noise that developers have to deal with mentally.
