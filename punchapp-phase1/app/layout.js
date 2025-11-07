
import './globals.css';
import MobileNav from '@/components/MobileNav';
export const metadata = { title: 'Punch', description: 'Pharmasave Punch App' };
export default function RootLayout({ children }){
  return (<html lang="en"><body><MobileNav /><main className="container">{children}</main></body></html>);
}
