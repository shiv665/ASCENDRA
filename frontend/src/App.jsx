import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import MentalHealth from './pages/MentalHealth'
import Career from './pages/Career'
import Finance from './pages/Finance'
import Social from './pages/Social'
import Academic from './pages/Academic'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { HourglassLoader, useGlobalLoader } from './components/HourglassLoader'

function App() {
  const { isLoading, message } = useGlobalLoader()
  
  return (
    <>
      <HourglassLoader show={isLoading} message={message} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="mental-health" element={<MentalHealth />} />
          <Route path="career" element={<Career />} />
          <Route path="finance" element={<Finance />} />
          <Route path="social" element={<Social />} />
          <Route path="academic" element={<Academic />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
