import { createTRPCRouter, protectedProcedure } from '../trpc'

export const usersRouter = createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
        const { data: user, error } = await ctx.db
            .from('users')
            .select('*')
            .eq('id', ctx.user.id)
            .single()

        if (error) {
            throw error
        }

        return user
    }),
})
