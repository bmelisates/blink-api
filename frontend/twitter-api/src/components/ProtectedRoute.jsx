import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
    // Kullanıcının token'ını kontrol ediyoruz.
    const token = localStorage.getItem('token')

      // token yoksa login sayfasına yönlendir.
      if (!token) {
        return <Navigate to="/login" replace />
      }
      // token varsa korumalı sayfayı göster.
      return children
    }

    export default ProtectedRoute
