import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="container-page py-28 text-center">
      <p className="font-display text-6xl font-semibold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  )
}
