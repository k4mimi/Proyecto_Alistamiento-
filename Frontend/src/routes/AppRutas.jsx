import { Routes, Route } from "react-router-dom";
import { Home } from "../components/home/Home";
import { Login } from "../components/login/Login";
import { Principal } from "../pages/Principal";
import { UsuariosPagina } from "../pages/UsuariosPagina";
import { RolesPagina } from "../pages/RolesPagina";
import { PermisosPagina } from "../pages/PermisosPagina";
import { RolPermisoPagina } from "../pages/RolPermisoPagina";
import { Bienvenido } from "../pages/Bienvenido";
import { useAuthContext } from "../context/AuthContext";
import { InstructorDashboard } from '../pages/instructor/InstructorDashboard';
import { SabanaPagina } from '../pages/SabanaPagina';
import { PlaneacionPedagogica } from "../pages/planeacion/PlaneacionPedagogica";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthContext();

  if (!user) return <Login />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Bienvenido />;

  return children;
};

export const AppRutas = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />

    {/* Instructor */}
    <Route
      path="/instructor"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <InstructorDashboard />
        </PrivateRoute>
      }
    />

    <Route
      path="/instructor/dashboard"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <InstructorDashboard />
        </PrivateRoute>
      }
    />

    <Route
      path="/sabana/:idFicha"
      element={
        <SabanaPagina />
      }
    />

   <Route
  path="/planeacion/:idFicha?"
  element={
    <PrivateRoute allowedRoles={["Instructor"]}>
      <PlaneacionPedagogica />
    </PrivateRoute>
  }
/>

    {/* Admin */}
    <Route
      path="/principal"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <UsuariosPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/usuarios"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <UsuariosPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/roles"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <RolesPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/permisos"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <PermisosPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/rol-permisos"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <RolPermisoPagina />
        </PrivateRoute>
      }
    />

    {/* Gestión de Sábana */}
    <Route
      path="/sabana"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <SabanaPagina />
        </PrivateRoute>
      }
    />

    {/* Cualquier usuario logueado */}
    <Route
      path="/bienvenido"
      element={
        <PrivateRoute>
          <Bienvenido />
        </PrivateRoute>
      }
    />
  </Routes>
);