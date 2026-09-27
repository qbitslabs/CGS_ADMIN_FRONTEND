/* React hook for the admin console: index.
 * Shared state or debounce/permission helper for operator pages. */
export * from './useDebounce';
export * from './usePermissions';
export { useAuth } from '../context/AuthContext';
export { useToast } from '../context/ToastContext';
