import { getSessionUser } from '@/lib/auth';

export function useAdminCompanyCheck() {
  const sessionUser = getSessionUser();
  const isAdmin = sessionUser?.subscriptionType === 'ADMIN';
  const hasCompany = Boolean(sessionUser?.companiaId);
  const isAdminWithoutCompany = isAdmin && !hasCompany;

  return {
    isAdmin,
    hasCompany,
    isAdminWithoutCompany,
    canFetchData: !isAdminWithoutCompany,
  };
}
