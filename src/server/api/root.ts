import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'
import { servicesRouter } from './routers/services'
import { customersRouter } from './routers/customers'
import { jobSitesRouter } from './routers/job-sites'
import { contractsRouter } from './routers/contracts'
import { quotesRouter } from './routers/quotes'
import { checklistsRouter } from './routers/checklists'
import { workersRouter } from './routers/workers'
import { contractorsRouter } from './routers/contractors'
import { invoicesRouter } from './routers/invoices'
import { settingsRouter } from './routers/settings'
import { jobsRouter } from './routers/jobs'
import { notesRouter } from './routers/notes'
import { attachmentsRouter } from './routers/attachments'

import { adminRouter } from './routers/admin'
import { activityRouter } from "@/server/api/routers/activity";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { certificationRouter } from "@/server/api/routers/certification";
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
    auth: authRouter,
    users: usersRouter,
    services: servicesRouter,
    customers: customersRouter,
    jobSites: jobSitesRouter,
    contracts: contractsRouter,
    quotes: quotesRouter,
    checklists: checklistsRouter,
    workers: workersRouter,
    contractors: contractorsRouter,
    invoices: invoicesRouter,
    settings: settingsRouter,
    jobs: jobsRouter,
    notes: notesRouter,
    attachments: attachmentsRouter,
    admin: adminRouter,
    activity: activityRouter,
    dashboard: dashboardRouter,
    certification: certificationRouter,
})

export const createCaller = createCallerFactory(appRouter)

export type AppRouter = typeof appRouter
