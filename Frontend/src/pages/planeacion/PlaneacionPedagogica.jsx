import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { NuevaPlaneacionForm } from './components/NuevaPlaneacionForm';
import { VistaPlaneacion } from './components/VistaPlaneacion';
import { planeacionService } from '../../services/planeacionService';
import { ModalExito } from '../../components/ui/ModalExito';
import { ModalError } from '../../components/ui/ModalError';
import { ModalConfirmacion } from '../../components/ui/ModalConfirmacion';
import { useAuthContext } from '../../context/AuthContext';
import './PlaneacionPedagogica.css';

export const PlaneacionPedagogica = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarVista, setMostrarVista] = useState(false);
  const [planeacionSeleccionada, setPlaneacionSeleccionada] = useState(null);
  const [planeaciones, setPlaneaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  
  // Estado para información de la ficha
  const [fichaInfo, setFichaInfo] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);

  // Estados para modales
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [planeacionAEliminar, setPlaneacionAEliminar] = useState(null);

  const navigate = useNavigate();
  const { idFicha } = useParams();
  const { user } = useAuthContext();

  // Debug effect para fichaInfo
  useEffect(() => {
    console.log('🔄 fichaInfo actualizado:', fichaInfo);
  }, [fichaInfo]);

  // Debug effect para idFicha
  useEffect(() => {
    console.log('🆔 idFicha desde params:', idFicha);
  }, [idFicha]);

  // Función CORREGIDA para cargar información de la ficha
  const cargarInfoFicha = async (idFicha) => {
    if (!idFicha) {
      console.warn('⚠️ No hay idFicha proporcionado');
      // Estructura básica para evitar null
      setFichaInfo({
        codigo_ficha: 'No disponible',
        nombre_programa: 'Ficha no especificada',
        nombre_instructor: 'No asignado',
        jornada: 'No definida',
        modalidad: 'No definida'
      });
      return;
    }

    try {
      setCargandoFicha(true);
      console.log('📋 Cargando información de ficha:', idFicha);

      let fichaEncontrada = null;
      
      // SOLO usar la lista completa, ya que /api/fichas/2 da 404
      try {
        const response = await fetch(`http://localhost:3000/api/fichas/todas`);
        if (response.ok) {
          const fichas = await response.json();
          fichaEncontrada = fichas.find(f => 
            f.id_ficha === parseInt(idFicha) || 
            f.id === parseInt(idFicha) ||
            f.codigo_ficha === idFicha.toString()
          );
          console.log('✅ Ficha encontrada en lista:', fichaEncontrada);
        } else {
          console.warn('⚠️ Error al obtener lista de fichas:', response.status);
        }
      } catch (error) {
        console.warn('⚠️ Error en la solicitud de fichas:', error);
      }

      if (fichaEncontrada) {
        // Estructura robusta para Sidebar
        const fichaInfoParaSidebar = {
          // Propiedades esenciales para Sidebar
          codigo_ficha: fichaEncontrada.codigo_ficha || fichaEncontrada.numero_ficha || idFicha.toString(),
          nombre_programa: fichaEncontrada.nombre_programa || fichaEncontrada.programa || 'Programa no asignado',
          jornada: fichaEncontrada.jornada || 'No definida',
          modalidad: fichaEncontrada.modalidad || 'No definida',
          nombre_instructor: 'Cargando...', // Valor temporal
          
          // Fechas
          fecha_inicio: fichaEncontrada.fecha_inicio,
          fecha_final: fichaEncontrada.fecha_final,
          
          // Propiedades alternativas para compatibilidad
          programa: fichaEncontrada.nombre_programa || fichaEncontrada.programa,
          instructor: 'Cargando...',
          
          // Datos adicionales
          ubicacion: fichaEncontrada.ubicacion,
          ambiente: fichaEncontrada.ambiente
        };

        console.log('🎯 Ficha info para Sidebar:', fichaInfoParaSidebar);
        
        // Establecer la estructura básica inmediatamente
        setFichaInfo(fichaInfoParaSidebar);

        // Luego cargar información del instructor si existe
        if (fichaEncontrada.id_instructor) {
          fetch(`http://localhost:3000/api/instructores/${fichaEncontrada.id_instructor}`)
            .then(instructorRes => {
              if (instructorRes.ok) {
                return instructorRes.json();
              }
              throw new Error(`Error ${instructorRes.status}`);
            })
            .then(instructorData => {
              const nombreInstructor = instructorData.nombre || 'Instructor no asignado';
              console.log('👨‍🏫 Instructor cargado:', nombreInstructor);
              
              setFichaInfo(prev => ({
                ...prev,
                nombre_instructor: nombreInstructor,
                instructor: nombreInstructor
              }));
            })
            .catch(error => {
              console.warn('⚠️ No se pudo cargar información del instructor:', error);
              setFichaInfo(prev => ({
                ...prev,
                nombre_instructor: 'No asignado',
                instructor: 'No asignado'
              }));
            });
        } else {
          // Si no hay instructor, actualizar inmediatamente
          setFichaInfo(prev => ({
            ...prev,
            nombre_instructor: 'No asignado',
            instructor: 'No asignado'
          }));
        }
        
      } else {
        console.warn('❌ No se encontró la ficha con ID:', idFicha);
        // Estructura de fallback robusta
        setFichaInfo({
          codigo_ficha: idFicha.toString(),
          nombre_programa: 'Ficha no encontrada en el sistema',
          nombre_instructor: 'No asignado',
          jornada: 'No definida',
          modalidad: 'No definida',
          programa: 'Ficha no encontrada',
          instructor: 'No asignado'
        });
      }
      
    } catch (error) {
      console.error('❌ Error crítico cargando información de ficha:', error);
      // Estructura de fallback definitiva
      setFichaInfo({
        codigo_ficha: idFicha?.toString() || 'Error',
        nombre_programa: 'Error al cargar información',
        nombre_instructor: 'No disponible',
        jornada: 'No definida',
        modalidad: 'No definida',
        programa: 'Error al cargar',
        instructor: 'No disponible'
      });
    } finally {
      setCargandoFicha(false);
    }
  };

  // Función para extraer el trimestre de las observaciones
  const extraerTrimestreDeObservaciones = (observaciones) => {
    if (!observaciones) return '1';
    
    const match = observaciones.match(/Trimestre\s+(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    return '1';
  };

  // Función para ver los detalles de una planeación
  const handleVerPlaneacion = async (planeacion) => {
    try {
      setCargandoDetalles(true);
      console.log('👀 Abriendo vista de planeación:', planeacion);
      
      // OBTENER LOS DATOS COMPLETOS DE LA PLANEACIÓN
      const planeacionCompleta = await planeacionService.obtenerDetallesPlaneacion(planeacion.id_planeacion || planeacion.id);
      
      console.log('📋 Datos completos obtenidos:', planeacionCompleta);
      
      if (planeacionCompleta) {
        // Asegurarnos de que la planeación tenga la estructura correcta
        const planeacionFormateada = {
          ...planeacionCompleta,
          // Si no viene trimestre, extraerlo de observaciones
          trimestre: planeacionCompleta.trimestre || (() => {
            const match = planeacionCompleta.observaciones?.match(/Trimestre\s+(\d+)/i);
            return match && match[1] ? parseInt(match[1]) : 1;
          })(),
          // Asegurar que info_ficha esté presente
          info_ficha: planeacionCompleta.info_ficha || {
            ficha: planeacionCompleta.ficha,
            programa: planeacionCompleta.programa,
            proyecto: planeacionCompleta.proyecto
          },
          // Asegurar que raps esté presente
          raps: planeacionCompleta.raps || []
        };
        
        console.log('🎯 Planeación formateada para vista:', planeacionFormateada);
        setPlaneacionSeleccionada(planeacionFormateada);
        setMostrarVista(true);
      } else {
        setMensajeModal('No se pudieron cargar los datos completos de la planeación');
        setMostrarModalError(true);
      }
      
    } catch (error) {
      console.error('❌ Error cargando la planeación completa:', error);
      setMensajeModal('Error al cargar la planeación: ' + error.message);
      setMostrarModalError(true);
    } finally {
      setCargandoDetalles(false);
    }
  };

  // Función para cerrar la vista de detalles
  const handleCerrarVista = () => {
    setMostrarVista(false);
    setPlaneacionSeleccionada(null);
  };

  // Función para volver a sábana manteniendo el contexto
  const handleVolverASabana = () => {
    if (idFicha) {
      navigate(`/sabana/${idFicha}`);
    } else {
      navigate('/sabana');
    }
  };

  const handleNuevaPlaneacion = () => setMostrarFormulario(true);
  const handleCancelar = () => setMostrarFormulario(false);

  // Función MEJORADA para cargar las planeaciones con manejo específico de error 500
  const cargarPlaneaciones = async () => {
    try {
      setLoading(true);
      console.log('📄 Cargando planeaciones desde la base de datos...');

      let datos;
      if (idFicha) {
        console.log(`🎯 Buscando planeaciones para ficha: ${idFicha}`);
        try {
          datos = await planeacionService.obtenerPlaneacionesPorFicha(idFicha);
        } catch (error) {
          if (error.message.includes('500')) {
            console.error('🔥 Error 500 del servidor - Probable problema en el backend');
            // Mostrar mensaje específico para error 500
            setMensajeModal('Error interno del servidor. El servicio de planeaciones no está disponible temporalmente. Por favor, intente más tarde.');
            setMostrarModalError(true);
            setPlaneaciones([]);
            return;
          }
          throw error; // Re-lanzar otros errores
        }
      } else {
        console.log('🌐 Buscando todas las planeaciones');
        datos = await planeacionService.obtenerPlaneaciones();
      }

      console.log('📊 Datos recibidos:', datos);

      // Manejo más robusto de la respuesta
      if (datos && datos.data) {
        setPlaneaciones(datos.data);
      } else if (Array.isArray(datos)) {
        setPlaneaciones(datos);
      } else if (datos && Array.isArray(datos.planeaciones)) {
        setPlaneaciones(datos.planeaciones);
      } else {
        console.warn('⚠️ Formato de datos inesperado, usando array vacío:', datos);
        setPlaneaciones([]);
      }

    } catch (error) {
      console.error('❌ Error cargando planeaciones:', error);
      
      // Mensaje de error más específico
      let mensajeError = 'Error al cargar las planeaciones';
      if (error.message.includes('500')) {
        mensajeError = 'Error interno del servidor. El servicio de planeaciones no está disponible.';
      } else if (error.message.includes('404')) {
        mensajeError = 'No se encontraron planeaciones para esta ficha.';
      } else if (error.message.includes('Network Error')) {
        mensajeError = 'Error de conexión. Verifica que el servidor esté en ejecución.';
      } else {
        mensajeError = `Error: ${error.message}`;
      }
      
      setMensajeModal(mensajeError);
      setMostrarModalError(true);
      setPlaneaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir modal de confirmación de eliminación
  const handleSolicitarEliminacion = (idPlaneacion) => {
    setPlaneacionAEliminar(idPlaneacion);
    setMostrarModalConfirmacion(true);
  };

  // Función para confirmar eliminación
  const handleConfirmarEliminacion = async () => {
    if (!planeacionAEliminar) return;

    try {
      setEliminando(planeacionAEliminar);
      console.log(`🗑️ Eliminando planeación ${planeacionAEliminar}...`);

      const resultado = await planeacionService.eliminarPlaneacion(planeacionAEliminar);

      if (resultado.success) {
        console.log('✅ Planeación eliminada exitosamente');
        setMensajeModal('Planeación eliminada exitosamente');
        setMostrarModalExito(true);
        setPlaneaciones(prev => prev.filter(p =>
          p.id_planeacion !== planeacionAEliminar && p.id !== planeacionAEliminar
        ));
      } else {
        setMensajeModal('Error al eliminar la planeación: ' + resultado.mensaje);
        setMostrarModalError(true);
      }
    } catch (error) {
      console.error('❌ Error eliminando planeación:', error);
      setMensajeModal('Error al eliminar la planeación: ' + error.message);
      setMostrarModalError(true);
    } finally {
      setEliminando(null);
      setPlaneacionAEliminar(null);
      setMostrarModalConfirmacion(false);
    }
  };

  // Función para cancelar eliminación
  const handleCancelarEliminacion = () => {
    setPlaneacionAEliminar(null);
    setMostrarModalConfirmacion(false);
  };

  // Función que se ejecuta cuando se guarda una nueva planeación
  const handlePlaneacionGuardada = () => {
    console.log('✅ Nueva planeación guardada, recargando lista...');
    cargarPlaneaciones();
    setMostrarFormulario(false);
  };

  // Cargar planeaciones e información de ficha cuando el componente se monta
  useEffect(() => {
    cargarPlaneaciones();
    if (idFicha) {
      cargarInfoFicha(idFicha);
    }
  }, [idFicha]);

  // Funciones para cerrar modales
  const handleCierreModalExito = () => {
    setMostrarModalExito(false);
  };

  const handleCierreModalError = () => {
    setMostrarModalError(false);
  };

  // Mostrar diferentes vistas
  if (mostrarFormulario) {
    return (
      <Layout showSidebar={true} fichaInfo={fichaInfo}>
        <NuevaPlaneacionForm
          onCancel={handleCancelar}
          onPlaneacionGuardada={handlePlaneacionGuardada}
          idFicha={idFicha}
          fichaInfo={fichaInfo}
        />
      </Layout>
    );
  }

  if (mostrarVista && planeacionSeleccionada) {
    return (
      <Layout showSidebar={true} fichaInfo={fichaInfo}>
        <VistaPlaneacion
          planeacion={planeacionSeleccionada}
          onClose={handleCerrarVista}
          user={user}
        />
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true} fichaInfo={fichaInfo}>
      {/* Modales */}
      {mostrarModalExito && (
        <ModalExito
          onClose={handleCierreModalExito}
          titulo="¡Operación Exitosa!"
          mensaje={mensajeModal}
          textoBoton="Continuar"
        />
      )}

      {mostrarModalError && (
        <ModalError
          onClose={handleCierreModalError}
          titulo="Error"
          mensaje={mensajeModal}
          textoBoton="Entendido"
        />
      )}

      {mostrarModalConfirmacion && (
        <ModalConfirmacion
          onClose={handleCancelarEliminacion}
          onConfirm={handleConfirmarEliminacion}
          titulo="Confirmar Eliminación"
          mensaje="¿Estás seguro de que quieres eliminar esta planeación? Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
        />
      )}

      <div className="planeacion-content-centered">
        {/* Header con navegación */}
        <div className="planeacion-header-nav">
          <button className="btn-volver" onClick={handleVolverASabana}>
            <span className="arrow-left">←</span>
            Volver a Sábana
          </button>
          <div className="header-info-nav">
            <h1 className="title-nav">Planeación Pedagógica</h1>
            <div className="subtitle-nav">
              {idFicha ? `Ficha ${idFicha} • ` : ''}
              {loading ? 'Cargando...' : `${planeaciones.length} planeaciones`}
              {cargandoFicha && ' • Cargando información de ficha...'}
            </div>
          </div>
          <button className="btn-generar" onClick={handleNuevaPlaneacion}>
            <span className="plus-icon">+</span>
            Generar planeación pedagógica
          </button>
        </div>

        {/* Lista de planeaciones */}
        <div className="planeaciones-list">
          {loading ? (
            <div className="loading-state">
              <p>Cargando planeaciones...</p>
            </div>
          ) : planeaciones.length === 0 ? (
            <div className="empty-state">
              <p>No hay planeaciones guardadas aún.</p>
              {idFicha && fichaInfo && (
                <p className="ficha-info-hint">
                </p>
              )}
            </div>
          ) : (
            Array.isArray(planeaciones) && planeaciones.map(planeacion => {
              const trimestre = extraerTrimestreDeObservaciones(planeacion.observaciones);
              
              return (
                <div key={planeacion.id_planeacion || planeacion.id} className="planeacion-card">
                  <div className="planeacion-main-content">
                    <div className="planeacion-left">
                      <div className="planeacion-title-row">
                        <h3>Trimestre {trimestre}</h3>
                        <span className={`estado-badge ${planeacion.estado || 'publicada'}`}>
                          {planeacion.estado || 'Publicada'}
                        </span>
                      </div>

                      <p className="planeacion-description">
                        Planeación pedagógica para el trimestre {trimestre} con {planeacion.total_raps || planeacion.raps_count || 0} RAPs
                      </p>

                      <div className="planeacion-meta">
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {user?.nombre || user?.username || 'Instructor'}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Creado: {new Date(planeacion.fecha_creacion).toLocaleDateString()}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Modificado: {new Date(planeacion.fecha_actualizacion || planeacion.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="planeacion-actions">
                      <button
                        className="btn-icon btn-eliminar"
                        title="Eliminar"
                        onClick={() => handleSolicitarEliminacion(planeacion.id_planeacion || planeacion.id)}
                        disabled={eliminando === (planeacion.id_planeacion || planeacion.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {eliminando === (planeacion.id_planeacion || planeacion.id) ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};