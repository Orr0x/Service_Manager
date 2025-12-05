import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
    auth: authRouter,
    users: usersRouter,
})

export const createCaller = createCallerFactory(appRouter)

export type AppRouter = typeof appRouter
