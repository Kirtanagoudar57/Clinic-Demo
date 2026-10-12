import { useEffect } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { ClinicProvider } from './lib/store'
import { AdminPage } from './pages/AdminPage'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { HomePage } from './pages/HomePage'
import { MyAppointmentPage } from './pages/MyAppointmentPage'
import { NotFoundPage } from './pages/NotFoundPage'

function Layout() {
  const { pathname, state } = useLocation() as { pathname: string; state: { scrollTo?: string } | null }
  useEffect(() => {
    if (!state?.scrollTo) window.scrollTo({ top: 0 })
  }, [pathname, state])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ClinicProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="booking/:ref" element={<ConfirmationPage />} />
            <Route path="my-appointment" element={<MyAppointmentPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ClinicProvider>
  )
}
