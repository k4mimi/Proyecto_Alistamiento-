import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../../assets/nodorap.png";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { CambioContrasenaModal } from "../ui/ModalCambioContraseña";
import { ModalError } from "../ui/ModalError";

export const Login = () => {
  const { login, user } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  
  // Nuevo estado para controlar si ya procesamos el login
  const [procesandoLogin, setProcesandoLogin] = useState(false);

  const navigate = useNavigate();
  const hasHandledUser = useRef(false);

  // Función para mostrar modal de error
  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  // Cerrar modal de error
  const cerrarModalError = () => setMostrarModalError(false);

  // Quita espacios y convierte a minúsculas
  const normalizarEmail = (correo) => correo.trim().toLowerCase();

  // Valida formato general
  const validarEmail = (correo) => {
    const regex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  };

  // Revisa que NO contenga espacios internos
  const contieneEspacios = (correo) => correo.includes(" ");

  // === EFECTO DESPUÉS DE LOGIN EXITOSO ===
  useEffect(() => {
    // Solo ejecutar si estamos procesando el login y tenemos usuario
    if (!procesandoLogin || !user || !user.id) return;

    // Evitar ejecutar varias veces
    if (hasHandledUser.current) return;

    console.log("🔍 Usuario después del login:", user);
    console.log("🔍 Primer acceso:", user.primer_acceso);
    console.log("🔍 Rol:", user.rol);

    hasHandledUser.current = true;

    // Verificar si necesita cambiar contraseña
    // Asegurar que comparamos correctamente valores booleanos/números
    const necesitaCambiarPassword = 
      user.primer_acceso === true || 
      user.primer_acceso === 1 || 
      user.primer_acceso === "true" || 
      user.primer_acceso === "1";

    const esInstructor = user.rol?.toLowerCase() === "instructor";
    const esGestor = user.rol?.toLowerCase() === "gestor";

    console.log("🔍 Necesita cambiar password:", necesitaCambiarPassword);
    console.log("🔍 Es instructor:", esInstructor);
    console.log("🔍 Es gestor:", esGestor);

    // SOLO instructores y gestores deben ver el modal en primer acceso
    if ((esInstructor || esGestor) && necesitaCambiarPassword) {
      console.log("🔄 Mostrando modal de cambio de contraseña...");
      setShowPasswordModal(true);
    } else {
      console.log("🔄 Redirigiendo según rol...");
      redirectByRole(user.rol);
    }

    // Resetear el estado de procesamiento
    setProcesandoLogin(false);

  }, [user, procesandoLogin]);

  // === FUNCIÓN PARA REDIRIGIR SEGÚN EL ROL ===
  const redirectByRole = (rol) => {
    console.log("📍 Redirigiendo rol:", rol);
    
    switch (rol?.toLowerCase()) {
      case "administrador":
        navigate("/principal");
        break;

      case "instructor":
      case "gestor":
        navigate("/instructor");
        break;

      default:
        console.warn("Rol no reconocido, redirigiendo a principal");
        navigate("/principal");
    }
  };

  // === MANEJO DEL LOGIN ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const emailNormalizado = normalizarEmail(email);

    // Reemplazar el email con el normalizado
    setEmail(emailNormalizado);

    // 1. Validar espacios internos
    if (contieneEspacios(emailNormalizado)) {
      mostrarError("El correo no puede contener espacios.");
      return;
    }

    // 2. Validar formato del correo
    if (!validarEmail(emailNormalizado)) {
      mostrarError("Ingresa un correo válido.");
      return;
    }

    // 3. Validar que no esté vacío
    if (!emailNormalizado) {
      mostrarError("El correo es obligatorio.");
      return;
    }

    // 4. Validar contraseña no vacía
    if (!password.trim()) {
      mostrarError("La contraseña es obligatoria.");
      return;
    }

    setLoading(true);
    hasHandledUser.current = false;
    setProcesandoLogin(false);

    try {
      console.log("🔐 Intentando login con:", emailNormalizado);
      
      const success = await login(emailNormalizado, password);

      if (!success) {
        mostrarError("Credenciales inválidas");
        setLoading(false);
        return;
      }

      console.log("✅ Login exitoso, procesando...");
      setProcesandoLogin(true);

    } catch (error) {
      console.error("❌ Error en login:", error);
      mostrarError("Error al iniciar sesión: " + error.message);
      setLoading(false);
    }
  };

  // Función para manejar el cierre del modal de cambio de contraseña
  const handleCierreModalCambio = () => {
    console.log("🔒 Modal de cambio cerrado, redirigiendo...");
    setShowPasswordModal(false);
    hasHandledUser.current = false;
    
    // Limpiar localStorage completamente
    localStorage.clear();
    sessionStorage.clear();
    
    // Forzar recarga completa para limpiar estado
    setTimeout(() => {
        window.location.href = "/login";
    }, 100);
};

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="back-link" onClick={() => navigate("/")}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Volver
        </div>

        <img src={logo} alt="NodoRAP Logo" className="login-logo" />
        <h2>Iniciar Sesión</h2>
        <p className="login-subtitle">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@sena.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOffIcon sx={{ color: "#bbb" }} />
                ) : (
                  <VisibilityIcon sx={{ color: "#bbb" }} />
                )}
              </span>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>

      {showPasswordModal && (
        <CambioContrasenaModal
          onClose={handleCierreModalCambio}
          onSuccess={() => {
            console.log("✅ Cambio de contraseña exitoso");
            // Aquí podrías actualizar el estado del usuario si es necesario
            // Por ejemplo, actualizar primer_acceso a false
          }}
        />
      )}

      {/* MODAL DE ERROR */}
      {mostrarModalError && (
        <ModalError
          onClose={cerrarModalError}
          titulo="Error"
          mensaje={mensajeError}
          textoBoton="Entendido"
        />
      )}
    </div>
  );
};