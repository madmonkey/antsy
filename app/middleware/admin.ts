export default defineNuxtRouteMiddleware(async () => {
  const { ok, ended } = await useAdminSession().check()
  if (!ok) return navigateTo({ path: '/admin/login', query: ended ? { ended: '1' } : {} })
})
