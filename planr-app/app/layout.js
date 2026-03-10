export const metadata = {
  title: 'PLANR',
  description: 'Last minute plans',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}