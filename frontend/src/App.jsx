import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardCoordinadora from './pages/DashboardCoordinadora'
import DashboardEmpleada from './pages/DashboardEmpleada'
import AsignacionSemana from './pages/AsignacionSemana'
import PlaybookPage from './pages/PlaybookPage'
import ReportesPage from './pages/ReportesPage'
import ConfigPage from './pages/ConfigPage'
import CambiarPassword from './pages/CambiarPassword'
import Layout from './components/Layout'

function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div>
  if (!usuario) return <Navigate to="/login" />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" />
  return children
}

function RutaInicio() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" />
  if (usuario.rol === 'coordinadora' || usuario.rol === 'supervisora') return <Navigate to="/dashboard" />
  return <Navigate to="/mis-tareas" />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<RutaProtegida><CambiarPassword /></RutaProtegida>} />
        <Route path="/" element={<RutaInicio />} />
        <Route path="/dashboard" element={
          <RutaProtegida roles={['coordinadora', 'supervisora']}>
            <Layout><DashboardCoordinadora /></Layout>
          </RutaProtegida>
        } />
        <Route path="/mis-tareas" element={
          <RutaProtegida roles={['empleada']}>
            <Layout><DashboardEmpleada /></Layout>
          </RutaProtegida>
        } />
        <Route path="/asignacion" element={
          <RutaProtegida roles={['coordinadora']}>
            <Layout><AsignacionSemana /></Layout>
          </RutaProtegida>
        } />
        <Route path="/playbook" element={
          <RutaProtegida roles={['coordinadora']}>
            <Layout><PlaybookPage /></Layout>
          </RutaProtegida>
        } />
        <Route path="/reportes" element={
          <RutaProtegida roles={['coordinadora']}>
            <Layout><ReportesPage /></Layout>
          </RutaProtegida>
        } />
        <Route path="/configuracion" element={
          <RutaProtegida roles={['coordinadora']}>
            <Layout><ConfigPage /></Layout>
          </RutaProtegida>
        } />
      </Routes>
    </AuthProvider>
  )
}
