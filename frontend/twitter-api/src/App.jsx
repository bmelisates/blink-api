import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ProtectedRoute from './components/ProtectedRoute'
import { LanguageProvider } from './contexts/LanguageContext'
import { TimeProvider } from './contexts/TimeContext'
import './App.css'
import ServerReadyGate from './components/ServerReadyGate'

const Home = lazy(() => import('./pages/Home'))
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Messages = lazy(() => import('./pages/Messages'))

function App() {
  return (
    // BrowserRouter: Uygulamadaki URL değişikliklerini takip eder ve URL'ye göre hangi component'in gösterileceğini yönetir.
    <LanguageProvider>
      <TimeProvider>
        <BrowserRouter>
          <ToastContainer position="top-right" />
          <ServerReadyGate>
          <Suspense fallback={<div className="route-loading">Yükleniyor...</div>}>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/:userId"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            </Routes>
          </Suspense>
          </ServerReadyGate>
        </BrowserRouter>
      </TimeProvider>
    </LanguageProvider>
  )
}

export default App
