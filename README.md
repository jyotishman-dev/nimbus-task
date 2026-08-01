# nimbus-task

# Concept 1 - What `strict: true` actually enforces

`strict : true ` in tsconfig.json, we are not enabling strictness  but acutally enabling a specific bundle of individual compiler flags all at once 

###  three most important rules 

- 1.  `strictNullChecks` (the biggest game changer)
      variables are no **longer ** allowed to be `null` or `undefined` unless you explicitly say so . 
      
- [ ] without strict : `let user: string = null ` (compiles fines , crash at runtime)
- [ ] with strict :  `let user : string | null = null; (You are forced to handle the null case)

- 2. `noImplicitAny`:
TypeScript will no longer guess and silently assign the any type to variables or function parameters if it can't figure out the type. It will throw an error and force you to type it explicitly.
- [ ] Without strict: `function print(data) { ... }` (TypeScript assumes data is any).
- [ ] With strict: `function print(data: unknown) { ... }` (Forces you to define it).


- 3 `strictPropertyInitialization`:
If you create a class property, TypeScript forces you to initialize it in the constructor, or mark it as optional (?) / definitely assigned (!).
Without strict: You can forget to assign a class property and TypeScript won't warn you.
With strict: Property 'name' has no initializer and is not definitely assigned in the constructor.


The Takeaway:` "strict": true` stops you from writing "sloppy JavaScript" by forcing you to handle nulls, define your types, and initialize your classes.

---

# Concept 2: Custom Error Hierarchies & The Prototype Chain

When you create a custom error in typescript by extending the native  `Error` class,
**the prototype chain breaks.**

If you don't fix it, `myError instanceof CustomError `will return `false`, which breaks error handling logic (like `catch (e) { if (e instanceof CustomError) ... })`.


**The Fix**: `Object.setPrototypeof`

to fix we need to add this exact custom error's constructor 

`Object.setPrototypeOf(this, new.target.prototype);`


```typescript

class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        
        // 1. THE MAGIC LINE: Fixes the broken prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        
        // 2. Set the name property for better stack traces
        this.name = 'AppError'; 
        this.statusCode = statusCode;
    }
}

// Let's test it:
const myError = new AppError("Something broke", 500);

console.log(myError instanceof AppError); // true (Works!)
console.log(myError instanceof Error);    // true (Still inherits from native Error)
```



Why use new.target.prototype instead of AppError.prototype?

You might wonder why we use `new.target.prototype` instead of just hardcoding `AppError.prototype`.

It's because of `inheritance`. If you create a sub-error later:



``` typescript
class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 500);
        // We don't need to repeat Object.setPrototypeOf here!
        this.name = 'DatabaseError';
    }
}

const dbError = new DatabaseError("Connection failed");

```


When you call `new DatabaseError()`, `new.target` automatically resolves to `DatabaseError`.
If we hardcoded `AppError.prototype`, `dbError instanceof DatabaseError` would be **false.**

Because we use `new.target.prototype`, it dynamically points to the actual class being instantiated, keeping the prototype chain perfectly intact no matter how deep your error hierarchy goes.




---


#  Phase 2 


> Phase 2 starts from here

# Separation of Concerns

##  The **Controller**
**The Job** - Handle the HTTP. It recives the Request, validates the input, calls the Service and return the HTTP Response (status code and JSON)

---
###  Why?
- *Framework Independence* - If your Controller talks directly to the database, it is tightly coupled to your database. If you decide to switch from Express to Fastify, or from a REST API to GraphQL, your Controller breaks. The Controller should only know about HTTP, not data storage.
- *Testability* -  If you want to write a unit test for your Controller, you shouldn't have to mock a database connection. The Controller should just pass data to the Service and check if the Service returned a success or failure.
- *Analogy:* The Controller is a bouncer at a club. The bouncer checks IDs (validation) and directs people to the VIP section (routes to Service). The bouncer does not go into the kitchen (Database) to cook the food.

--- 

## The **Service**   `(The Brain)`
**The Job** :  It takes plain data from the Controller, applies rules, talks to the Repository to get/save data, and returns plain data back.

**The Golden Rule:** It should not know about HTTP (no `req` or `res` objects) and it should not write raw SQL/Queries.

---
**Why?**
- *Reusability*: If your business logic is trapped in a Controller, you can't reuse it. What if you need to trigger the exact same logic from a background cron job or a WebSocket event? If the logic is in the Service layer, you can call it from anywhere without needing an HTTP request.

---
##  The Repository (The Librarian)

**The Job**: Talk to the database. It handles the actual CRUD (Create, Read, Update, Delete) operations.

**The Golden Rule**: A Repository should NEVER contain if/else business logic. It should only contain database queries.

**Why?**

- Single Responsibility: A repository's only job is to fetch or save data. It should be "dumb".
- Reusability: Imagine you put this logic in your Repository:

``` Typescript
  // BAD: Business logic in the Repository
  async getActiveUsers() {
      const users = await db.find({});
      if (users.age > 18 && users.hasPaid) { // <-- THIS IS BUSINESS LOGIC
          return users;
      }
  }

```

If you need to check if a user is "active" somewhere else in your app, you can't reuse this. Instead, the Repository should just be `getAllUsers()`. The Service layer should do the `if (user.age > 18)` check.



- Testability: You want to be able to unit test your business logic (Service) without hitting a real database. If your Repository is just simple queries, it's incredibly easy to mock. If it contains complex business logic, mocking it becomes a nightmare.
- Analogy: The Repository is a librarian. You ask for a book, they go to the shelf and get it. They do not decide if you are old enough to read the book (that's business logic for the Service). They just fetch the data you asked for.


---
# Phase 3 
> Phase 3 Starts here


# Concept 1: Synchronous vs. Asynchronous Errors in Express


To understand the fix, you must understand the problem. Express was created in 2010, long before JavaScript had `async/await` or native Promises. Because of this historical baggage, it treats sync and async errors very differently.



 - [ ]  **  Synchronous Errors (Express catches these automatically)**
If you throw an error synchronously in a route, Express catches it natively and passes it to your global error-handling middleware.

``` typescript
// Express catches this automatically!
app.get('/sync', (req, res, next) => {
    throw new Error("Sync error!"); 
    // Express catches this and sends it to (err, req, res, next)
});
```


- [ ] ** Asynchronous Errors (Express IGNORES these)**
If an error happens inside an  `async` function (like a failed database query), Express does not catch it.


``` typescript
// Express DOES NOT catch this!
app.get('/async', async (req, res, next) => {
    const user = await db.findById("invalid_id"); // Throws an error!
    res.json(user);
});
```

**Why?** Because the route handler returns a Promise immediately. Express doesn't know how to wait for that Promise to reject.
**The Result: ** The error is swallowed. The HTTP request just hangs forever until it times out, OR it causes an `UnhandledPromiseRejection` which crashes your entire Node.js server.

---

# Concept 2: The Golden Rule of Async Errors

To make Express handle an asynchronous error, you must explicitly catch the rejected Promise and pass the error to the `next()` function.
When you call  `next(error)`, Express skips all normal middleware and jumps straight to your global error-handling middleware `(err, req, res, next) => {}`.




# Concept 3: The Two Ways to Fix It
You have two options to solve this.you need to know both, but you must prefer the first one.
**Option A: The Custom catchAsync Higher-Order Function (The Senior Way)**

Instead of writing try/catch in every single controller (which violates the DRY principle), you write a wrapper function.

``` typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

// The Higher-Order Function
const catchAsync = (fn: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // We wrap the execution in Promise.resolve to catch BOTH 
        // sync throws and async rejections, then pass errors to next()
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// How you use it in your Controller:
export const getUser = catchAsync(async (req, res, next) => {
    // If this fails, catchAsync catches it and calls next(error) automatically!
    const user = await userService.findById(req.params.id); 
    res.json(user);
});
```

**Why this is the answer**:
> * It shows you understand JavaScript closures, Higher-Order Functions, and the event loop. It keeps your controllers incredibly clean and removes the need for external libraries.*



**Option B: The express-async-errors Library (The Quick Way)**
There is an npm package called express-async-errors. You just import it at the very top of your app.ts file:

``` typescript
import 'express-async-errors'; 

```