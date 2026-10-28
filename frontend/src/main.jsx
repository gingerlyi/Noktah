import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { AppProvider, DEMO } from './lib/app.jsx';
import { PublicLayout } from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import PrdList from './pages/PrdList.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import LibraryPage, { LibraryDetail } from './pages/Library.jsx';
import Structure from './pages/Structure.jsx';
import Guide from './pages/Guide.jsx';
import Pricing from './pages/Pricing.jsx';
import Wizard from './pages/Wizard.jsx';
import Shared from './pages/Shared.jsx';
import PrdEdit from './pages/PrdEdit.jsx';
import { AdminLayout, AdminLogin, Need, UserLayout } from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Templates, { TemplateEdit } from './pages/admin/Templates.jsx';
import Site from './pages/admin/Site.jsx';
import { Roles, Users } from './pages/admin/People.jsx';
import AdminGuide from './pages/admin/Guide.jsx';

// Mode pratinjau tidak punya alamat sendiri untuk tiap halaman, jadi rutenya disimpan di memori.
const Router = DEMO ? MemoryRouter : BrowserRouter;

function NotFound() {
  return (
    <main className="view tight">
      <div className="empty">
        <h2>Halaman tidak ditemukan</h2>
        <p>Alamat yang kamu buka tidak ada di Noktah.</p>
        <Link className="btn" to="/">
          Ke beranda
        </Link>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AppProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/masuk" element={<Auth mode="login" />} />
            <Route path="/daftar" element={<Auth mode="register" />} />
            <Route path="/perpustakaan" element={<LibraryPage />} />
            <Route path="/perpustakaan/:id" element={<LibraryDetail />} />
            <Route path="/struktur" element={<Structure />} />
            <Route path="/cara-pakai" element={<Guide />} />
            <Route path="/harga" element={<Pricing />} />
            <Route path="/buat" element={<Wizard />} />
            <Route path="/p/:token" element={<Shared />} />
            <Route path="/prd/baru" element={<Navigate to="/perpustakaan" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/prd" element={<PrdList />} />
            <Route path="/prd/:id" element={<PrdEdit />} />
          </Route>
          <Route path="/admin/masuk" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Need perm="dash"><Dashboard /></Need>} />
            <Route path="templat" element={<Need perm="tpl"><Templates /></Need>} />
            <Route path="templat/:id" element={<Need perm="tpl"><TemplateEdit /></Need>} />
            <Route path="landing" element={<Need perm="site"><Site /></Need>} />
            <Route path="pengguna" element={<Need perm="users"><Users /></Need>} />
            <Route path="peran" element={<Need perm="roles"><Roles /></Need>} />
            <Route path="panduan" element={<Need perm="dash"><AdminGuide /></Need>} />
          </Route>
        </Routes>
      </AppProvider>
    </Router>
  </StrictMode>,
);
