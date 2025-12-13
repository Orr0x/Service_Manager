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
import { locationRouter } from './routers/location'

import { adminRouter } from './routers/admin'
import { activityRouter } from "@/server/api/routers/activity";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { certificationRouter } from "@/server/api/routers/certification";
import { workerRouter } from "./routers/worker";
import { customerPortalRouter } from "./routers/customer-portal";
import { configRouter } from "./routers/config";
import { reportsRouter } from "./routers/reports";
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
    auth: authRouter,
    dashboard: dashboardRouter,
    customers: customersRouter,
    jobs: jobsRouter,
    quotes: quotesRouter,
    invoices: invoicesRouter,
    workers: workersRouter,
    contractors: contractorsRouter,
    services: servicesRouter,
    jobSites: jobSitesRouter,
    checklists: checklistsRouter,
    contracts: contractsRouter,
    settings: settingsRouter,
    users: usersRouter,
    admin: adminRouter,
    worker: workerRouter,
    customerPortal: customerPortalRouter,
    notes: notesRouter,
    attachments: attachmentsRouter,
    activity: activityRouter,
    certification: certificationRouter,
    location: locationRouter,
    config: configRouter,
    reports: reportsRouter,
})

export const createCaller = createCallerFactory(appRouter)

export type AppRouter = typeof appRouter
