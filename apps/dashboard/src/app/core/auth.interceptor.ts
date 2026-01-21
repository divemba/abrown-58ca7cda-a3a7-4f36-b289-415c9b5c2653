import { HttpInterceptorFn } from '@angular/common/http';
import { authStorage } from './auth.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authStorage.get();
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
