import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'
import { servicesRouter } from './routers/services'
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
    auth: authRouter,
    users: usersRouter,
    services: servicesRouter,
})

export const createCaller = createCallerFactory(appRouter)

export type AppRouter = typeof appRouter
