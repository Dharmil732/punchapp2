
import { NextResponse } from 'next/server';
const PUBLIC = ['/auth/sign-in','/auth/reset','/auth/signup','/api/notifications/push/public-key'];
export function middleware(req){
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some(p=>path.startsWith(p)) || path.startsWith('/_next') || path.startsWith('/favicon') || path.startsWith('/manifest.json') || path.startsWith('/service-worker.js');
  if (isPublic) return NextResponse.next();
  const ck = req.cookies;
  const has = ck.get('sb-access-token')?.value || ck.get('sb:token')?.value || ck.get('supabase-auth-token')?.value;
  if (!has){
    const url = req.nextUrl.clone(); url.pathname='/auth/sign-in'; url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next|favicon|manifest\.json|service-worker\.js).*)'] };
