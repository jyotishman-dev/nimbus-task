import type { NextFunction, Request, RequestHandler, Response } from "express";



// 🧠 SENIOR DEV NOTE: This is the Higher-Order Function.
// It takes an async route handler, wraps it in a Promise, 
// and catches any rejections, passing them directly to Express's next() function

export const catchAsync = (fn : RequestHandler) =>{
    return (req: Request, res: Response , next: NextFunction) =>{
        Promise.resolve(fn(req,res,next)).catch(next)
    }
}


