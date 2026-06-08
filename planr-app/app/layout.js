import '../globals.css';

export const metadata = {
  title: 'PLANR.',
  description: 'London in 60 seconds',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
