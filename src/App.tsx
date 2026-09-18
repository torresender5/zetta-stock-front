import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RequireRole from './components/RequireRole'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Clients from './pages/Clients'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import AccountsPayable from './pages/AccountsPayable'
import AccountsReceivable from './pages/AccountsReceivable'
import UserManagement from './pages/UserManagement'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<RequireRole view="products"><Products /></RequireRole>} />
        <Route path="/clients" element={<RequireRole view="clients"><Clients /></RequireRole>} />
        <Route path="/suppliers" element={<RequireRole view="suppliers"><Suppliers /></RequireRole>} />
        <Route path="/purchases" element={<RequireRole view="purchases"><Purchases /></RequireRole>} />
        <Route path="/sales" element={<RequireRole view="sales"><Sales /></RequireRole>} />
        <Route path="/invoices" element={<RequireRole view="invoices"><Invoices /></RequireRole>} />
        <Route path="/accounts-payable" element={<RequireRole view="accountsPayable"><AccountsPayable /></RequireRole>} />
        <Route path="/accounts-receivable" element={<RequireRole view="accountsReceivable"><AccountsReceivable /></RequireRole>} />
        <Route path="/users" element={<RequireRole view="users"><UserManagement /></RequireRole>} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
    </Routes>
  )
}
