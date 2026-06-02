const STORAGE_KEY = 'sr_admin_basic_auth';

export function getAdminAuthHeader() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

