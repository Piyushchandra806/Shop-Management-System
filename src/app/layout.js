import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'MayankComputer - Printing Press Management System',
  description: 'A modern, simple, and fast tracking system for print shops',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="animate-fade-in">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
