/**
 * Página de Gestión de Sábana por Ficha - Diseño Kanban
 */

import { useState, useEffect, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./SabanaPagina.css";
import {
  obtenerSabanaPorFicha,
  obtenerTrimestres,
  asignarRAP,
  desasignarRAP,
  obtenerInstructoresPorFicha,
  asignarInstructor,
  desasignarInstructor,
} from "../services/sabanaService";
import ColumnaTrimestre from "../components/ColumnaTrimestre";
import BandejaNoAsignados from "../components/BandejaNoAsignados";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { HeaderSabana } from "../components/layout/HeaderSabana";
import { useAuthContext } from "../context/AuthContext";

// Modal para mostrar información detallada del RAP
// Modal para mostrar información detallada del RAP
const ModalInfoRAP = ({ rap, competencia, rapsAsociados, onClose }) => {
  if (!rap || !competencia) return null;

  // Datos seguros con valores por defecto
  const safeRap = {
    codigo_rap: rap.codigo_rap || rap.codigo || "N/A",
    descripcion_rap: rap.descripcion_rap || rap.descripcion || rap.nombre || "N/A",
    duracion_rap: rap.duracion_rap || rap.duracion || "N/A"
  };

  const safeCompetencia = {
    codigo_competencia: competencia.codigo_competencia || competencia.codigo || "N/A",
    nombre_competencia: competencia.nombre_competencia || competencia.nombre || "N/A",
    duracion_maxima: competencia.duracion_maxima || competencia.duracion || "N/A",
    codigo_norma: competencia.codigo_norma || competencia.norma_codigo || "N/A"
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Información Detallada del RAP</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Información del RAP seleccionado */}
          <div className="rap-info-section">
            <h4>RAP Seleccionado</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Código RAP:</label>
                <span className="info-value">{safeRap.codigo_rap}</span>
              </div>
              <div className="info-item">
                <label>Descripción:</label>
                <span className="info-value">{safeRap.descripcion_rap}</span>
              </div>
              <div className="info-item">
                <label>Duración RAP:</label>
                <span className="info-value">{safeRap.duracion_rap} horas</span>
              </div>
            </div>
          </div>

          {/* Información de la Competencia */}
          <div className="competencia-info-section">
            <h4>Competencia Asociada</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Código Competencia:</label>
                <span className="info-value">{safeCompetencia.codigo_competencia}</span>
              </div>
              <div className="info-item">
                <label>Nombre Competencia:</label>
                <span className="info-value">{safeCompetencia.nombre_competencia}</span>
              </div>
              <div className="info-item">
                <label>Duración Máxima:</label>
                <span className="info-value">{safeCompetencia.duracion_maxima} horas</span>
              </div>
              <div className="info-item">
                <label>Código Norma:</label>
                <span className="info-value">{safeCompetencia.codigo_norma}</span>
              </div>
            </div>
          </div>

          {/* Lista de RAPs asociados a la competencia */}
          <div className="raps-asociados-section">
            <h4>RAPs Asociados a esta Competencia ({rapsAsociados.length})</h4>
            {rapsAsociados.length > 0 ? (
              <div className="raps-list">
                {rapsAsociados.map((rapAsociado) => (
                  <div
                    key={rapAsociado.id_rap || rapAsociado.id}
                    className={`rap-asociado-item ${(rapAsociado.id_rap || rapAsociado.id) === rap.id_rap ? "rap-actual" : ""}`}
                  >
                    <div className="rap-codigo">{rapAsociado.codigo_rap || rapAsociado.codigo || "N/A"}</div>
                    <div className="rap-descripcion">{rapAsociado.descripcion_rap || rapAsociado.descripcion || rapAsociado.nombre || "N/A"}</div>
                    <div className="rap-duracion">{rapAsociado.duracion_rap || rapAsociado.duracion || "N/A"} horas</div>
                    {(rapAsociado.id_rap || rapAsociado.id) === rap.id_rap && <div className="rap-actual-badge">Actual</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay otros RAPs asociados a esta competencia.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const SabanaPagina = () => {
  const { idFicha } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [fichaSeleccionada, setFichaSeleccionada] = useState(idFicha ? parseInt(idFicha) : null);
  const [sabana, setSabana] = useState(null);
  const [mapaTrimestres, setMapaTrimestres] = useState({});
  const [mapaAsignaciones, setMapaAsignaciones] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(new Set());
  const [infoFicha, setInfoFicha] = useState(null);
  const [infoPrograma, setInfoPrograma] = useState(null);
  const [instructores, setInstructores] = useState([]); // <-- inicializar como array
  const [asignandoInstructor, setAsignandoInstructor] = useState(false);

  // Nuevos estados para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rapSeleccionado, setRapSeleccionado] = useState(null);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(null);
  const [rapsAsociados, setRapsAsociados] = useState([]);

  const [rapCopiado, setRapCopiado] = useState(null);
  const [modoCopiar, setModoCopiar] = useState(false);

  useEffect(() => {
    if (fichaSeleccionada) {
      cargarSabana(fichaSeleccionada);
      cargarInstructores(fichaSeleccionada);
    } else {
      setSabana(null);
      setMapaTrimestres({});
      setMapaAsignaciones({});
    }
  }, [fichaSeleccionada]);

  useEffect(() => {
    if (idFicha) {
      setFichaSeleccionada(parseInt(idFicha));
    }
  }, [idFicha]);

  const cargarInstructores = async (idFicha) => {
    try {
      const data = await obtenerInstructoresPorFicha(idFicha);
      setInstructores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando instructores:", err);
      setInstructores([]);
    }
  };

  const handleAsignarInstructor = async (idRapTrimestre, idInstructor) => {
    if (!idRapTrimestre) return;

    setAsignandoInstructor(true);
    try {
      if (idInstructor) {
        await asignarInstructor(idRapTrimestre, idInstructor); // ahora el servicio espera (id_rap_trimestre, id_instructor)
      } else {
        await desasignarInstructor(idRapTrimestre);
      }

      // Recargar la sábana para reflejar cambios
      if (fichaSeleccionada) {
        await cargarSabana(fichaSeleccionada);
      }
    } catch (err) {
      console.error("Error asignando instructor:", err);
      setError(`Error al asignar instructor: ${err.message}`);
    } finally {
      setAsignandoInstructor(false);
    }
  };
  // ---- Handler que activa el modo copia desde la tarjeta ----
  const copiarRAP = (rap, asignacion = null) => {
    // Guardar el RAP (y su asignación originaria si existe) en estado
    setRapCopiado({ rap, asignacion });
    setModoCopiar(true);
  };

  // Modifica handleClickRAP para ver el objeto completo
  const handleClickRAP = (rap) => {
    if (!rap) return;

    console.log("🎯 RAP completo para debug:", rap);
    console.log("🔍 Buscando código de competencia en:");
    console.log("- rap.codigo_competencia:", rap.codigo_competencia);
    console.log("- rap.competencia_codigo:", rap.competencia_codigo);
    console.log("- rap.codigo:", rap.codigo);
    console.log("- rap.competencia?.codigo:", rap.competencia?.codigo);

    // Buscar el código de competencia con múltiples intentos
    const codigoCompetencia =
      rap.codigo_competencia ||
      rap.competencia_codigo ||
      rap.competencia?.codigo ||
      (rap.codigo && rap.codigo.startsWith("C") ? rap.codigo : null) ||
      "N/A";

    const competencia = {
      id_competencia: rap.id_competencia,
      codigo_competencia: codigoCompetencia,
      nombre_competencia: rap.nombre_competencia || rap.competencia_nombre || "N/A",
      duracion_maxima: rap.duracion_maxima_competencia || rap.duracion_maxima || "N/A",
      codigo_norma: rap.codigo_norma || "N/A"
    };

    console.log("🏆 Competencia preparada:", competencia);

    setRapSeleccionado(rap);
    setCompetenciaSeleccionada(competencia);

    // Buscar todos los RAPs asociados a esta competencia
    if (sabana && Array.isArray(sabana)) {
      const rapsDeEstaCompetencia = sabana.filter((r) => r.id_competencia === rap.id_competencia);
      setRapsAsociados(rapsDeEstaCompetencia);
    }

    setModalAbierto(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setRapSeleccionado(null);
    setCompetenciaSeleccionada(null);
    setRapsAsociados([]);
  };

  const cargarSabana = async (idFicha) => {
    try {
      setCargando(true);
      setError(null);

      console.log("🔄 Cargando sábana para ficha:", idFicha);

      const [datosSabanaMatriz, datosTrimestres, fichasResponse] = await Promise.all([
        obtenerSabanaPorFicha(idFicha),
        obtenerTrimestres(idFicha).catch(() => []),
        fetch(`http://localhost:3000/api/fichas/todas`)
          .then((res) => {
            if (!res.ok) throw new Error("Error obteniendo fichas");
            return res.json();
          })
          .catch(() => []),
      ]);

      const datosFicha = Array.isArray(fichasResponse)
        ? fichasResponse.find((f) => f.id_ficha === parseInt(idFicha))
        : null;

      // Procesar ficha (igual que antes)...
      if (datosFicha) {
        try {
          const nombrePrograma = datosFicha.nombre_programa || datosFicha.programa || "Programa no asignado";

          let nombreInstructor = "No asignado";
          if (datosFicha.id_instructor) {
            try {
              const instructorRes = await fetch(`http://localhost:3000/api/instructores/${datosFicha.id_instructor}`);
              if (instructorRes.ok) {
                const instructorData = await instructorRes.json();
                nombreInstructor = instructorData.nombre || "Instructor no asignado";
              }
            } catch (err) {
              console.warn("⚠️ No se pudo cargar información del instructor:", err);
            }
          }

          const fichaInfoParaSidebar = {
            codigo_ficha: datosFicha.codigo_ficha || datosFicha.id_ficha || idFicha,
            nombre_programa: nombrePrograma,
            nombre_instructor: nombreInstructor,
            jornada: datosFicha.jornada,
            modalidad: datosFicha.modalidad,
            fecha_inicio: datosFicha.fecha_inicio,
            fecha_final: datosFicha.fecha_final,
            programa: nombrePrograma,
            instructor: nombreInstructor,
            gestor: user?.nombre,
          };

          setInfoFicha(fichaInfoParaSidebar);
          setInfoPrograma({ nombre_programa: nombrePrograma });
        } catch (err) {
          const fichaInfoBasica = {
            codigo_ficha: datosFicha.codigo_ficha || datosFicha.id_ficha || idFicha,
            nombre_programa: datosFicha.nombre_programa || datosFicha.programa || "Programa no disponible",
            nombre_instructor: datosFicha.nombre_instructor || "No asignado",
            jornada: datosFicha.jornada || "Diurna",
            modalidad: datosFicha.modalidad || "Presencial",
            fecha_inicio: datosFicha.fecha_inicio,
            fecha_final: datosFicha.fecha_final,
          };
          setInfoFicha(fichaInfoBasica);
          setInfoPrograma(null);
        }
      } else {
        const fichaInfoBasica = {
          codigo_ficha: idFicha,
          nombre_programa: "Programa no asignado",
          nombre_instructor: "No asignado",
          jornada: "Diurna",
          modalidad: "Presencial",
          fecha_inicio: null,
          fecha_final: null,
        };
        setInfoFicha(fichaInfoBasica);
        setInfoPrograma(null);
      }

      // Crear mapa de trimestres
      const mapa = {};
      if (datosTrimestres && Array.isArray(datosTrimestres)) {
        datosTrimestres.forEach((trimestre) => {
          if (trimestre.id_trimestre && trimestre.no_trimestre !== undefined) {
            mapa[trimestre.no_trimestre] = trimestre.id_trimestre;
          }
        });
      }

      if (Object.keys(mapa).length === 0) {
        const jornada = datosFicha?.jornada?.toLowerCase() || "";

        const totalTrimestres = jornada.includes("noct") ? 9 : 7;

        for (let i = 1; i <= totalTrimestres; i++) {
          mapa[i] = i;
        }
      }
      // Procesar asignaciones
      const asignaciones = {};
      const rapsUnicos = [];

      if (datosSabanaMatriz && Array.isArray(datosSabanaMatriz)) {
        datosSabanaMatriz.forEach((rapMatriz) => {
          if (!rapMatriz.id_rap) return;

          console.log("📦 RAP Matriz recibido:", {
            id_rap: rapMatriz.id_rap,
            codigo_rap: rapMatriz.codigo_rap,
            id_competencia: rapMatriz.id_competencia,
            // Campos de competencia
            codigo_competencia: rapMatriz.codigo_competencia,
            nombre_competencia: rapMatriz.nombre_competencia,
            duracion_maxima_competencia: rapMatriz.duracion_maxima_competencia,
            codigo_norma: rapMatriz.codigo_norma,
            // Campos adicionales por si acaso
            competencia_codigo: rapMatriz.competencia_codigo,
            competencia_nombre: rapMatriz.competencia_nombre,
            duracion_maxima: rapMatriz.duracion_maxima
          });

          rapsUnicos.push({
            id_rap: rapMatriz.id_rap,
            codigo_rap: rapMatriz.codigo_rap,
            descripcion_rap: rapMatriz.descripcion_rap,
            duracion_rap: rapMatriz.duracion_rap,
            id_competencia: rapMatriz.id_competencia,

            codigo_competencia:
              rapMatriz.codigo_competencia ||
              rapMatriz.competencia_codigo ||
              rapMatriz.codigo_comp ||
              "N/A",

            nombre_competencia: rapMatriz.nombre_competencia || rapMatriz.competencia_nombre || "N/A",
            duracion_maxima_competencia: rapMatriz.duracion_maxima_competencia || rapMatriz.duracion_maxima || "N/A",
            codigo_norma: rapMatriz.codigo_norma || "N/A",


            // Campos alternativos
            competencia_codigo: rapMatriz.competencia_codigo,
            competencia_nombre: rapMatriz.competencia_nombre,
            duracion_maxima: rapMatriz.duracion_maxima,
            duracion_competencia: rapMatriz.duracion_competencia,
            norma_codigo: rapMatriz.norma_codigo

          });

          const totalTrimestres =
            Object.keys(mapa).length > 0
              ? Math.max(...Object.keys(mapa).map((n) => parseInt(n, 10)))
              : datosFicha?.jornada?.toString().toLowerCase().includes("noct")
                ? 9
                : 7;

          // Buscar asignaciones existentes
          for (let i = 1; i <= totalTrimestres; i++) {
            const horasTrimestre = rapMatriz[`t${i}_htrim`] ?? 0;
            const idRapTrimestreReal = rapMatriz[`t${i}_id_rap_trimestre`];

            // Si no hay id_rap_trimestre no hay asignación para ese trimestre -> seguimos
            if (!idRapTrimestreReal) continue;

            const idTrimestre = mapa[i];
            if (idTrimestre) {
              if (!asignaciones[rapMatriz.id_rap]) {
                asignaciones[rapMatriz.id_rap] = {};
              }

              asignaciones[rapMatriz.id_rap][idTrimestre] = {
                id_rap_trimestre: idRapTrimestreReal,
                horas_trimestre: horasTrimestre,
                horas_semana: rapMatriz[`t${i}_hsem`] ?? horasTrimestre / 11,
                id_trimestre: idTrimestre,
                id_rap: rapMatriz.id_rap,
                no_trimestre: i,
                estado: rapMatriz[`t${i}_estado`] || "Planeado",
                id_instructor: rapMatriz[`t${i}_id_instructor`] || null,
                instructor_asignado: rapMatriz[`t${i}_instructor`] || rapMatriz.nombre_instructor || null,
              };
            }
          }
        });
      }

      setSabana(rapsUnicos);
      setMapaTrimestres(mapa);
      setMapaAsignaciones(asignaciones);
    } catch (err) {
      console.error("❌ Error cargando sábana:", err);
      setError(`Error al cargar sábana: ${err.message}`);
      setSabana([]);
      setMapaTrimestres({});
      setMapaAsignaciones({});
    } finally {
      setCargando(false);
    }
  };

  // ---- Pegar el RAP en un idTrimestre concreto (no borra asignaciones previas) ----
  const pegarRAPEnTrimestre = async (idTrimestre) => {
    if (!rapCopiado || !fichaSeleccionada) return;

    const idRap = rapCopiado.rap.id_rap;
    const clave = `copiar-${idRap}-${idTrimestre}`;

    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      // Llamada al servicio: crear/actualizar asignación para el RAP en el trimestre destino
      // No desasigna la asignación origen.
      await asignarRAP(idRap, idTrimestre, fichaSeleccionada);

      // Recargar datos
      await cargarSabana(fichaSeleccionada);
    } catch (err) {
      console.error("Error al pegar RAP:", err);
      setError(`Error al pegar RAP: ${err.message || err}`);
    } finally {
      procesando.delete(clave);
      setProcesando(new Set(procesando));
    }
  };

  const obtenerIdTrimestre = (noTrimestre) => {
    return mapaTrimestres[noTrimestre] || null;
  };

  const rapsOrganizados = useMemo(() => {
    if (!sabana || !Array.isArray(sabana) || sabana.length === 0) {
      return { noAsignados: [], porTrimestre: {} };
    }

    const noAsignados = [];
    const porTrimestre = {};

    // Inicializar trimestres
    const trimestresDisponibles = (() => {
      const clavesMapa = Object.keys(mapaTrimestres);
      if (clavesMapa.length > 0) {
        return clavesMapa.map((n) => parseInt(n, 10)).sort((a, b) => a - b);
      }

      // Fallback dinámico: inferir por jornada en infoFicha
      const jornada = infoFicha?.jornada?.toString().toLowerCase() || "";
      const fallbackTotal = jornada.includes("noct") ? 9 : 7;
      return Array.from({ length: fallbackTotal }, (_, i) => i + 1);
    })();

    trimestresDisponibles.forEach((noTrimestre) => {
      const idTrimestre = mapaTrimestres[noTrimestre];
      if (idTrimestre) {
        porTrimestre[idTrimestre] = {
          noTrimestre: noTrimestre,
          idTrimestre: idTrimestre,
          raps: [],
        };
      }
    });

    sabana.forEach((rap) => {
      if (!rap || !rap.id_rap) return;

      let asignado = false;

      if (mapaAsignaciones[rap.id_rap]) {
        // Iterar claves de asignaciones tal cual (string keys)
        for (const key in mapaAsignaciones[rap.id_rap]) {
          if (!Object.prototype.hasOwnProperty.call(mapaAsignaciones[rap.id_rap], key)) continue;
          const idTrimestreKey = key;
          const asignacion = mapaAsignaciones[rap.id_rap][idTrimestreKey];

          if (asignacion && (asignacion.id_rap_trimestre || asignacion.horas_trimestre !== undefined)) {
            const idTrimestre = asignacion.id_trimestre;
            if (porTrimestre[idTrimestre]) {
              porTrimestre[idTrimestre].raps.push({ rap, asignacion });
              asignado = true;
            }
          }
        }
      }

      if (!asignado) {
        noAsignados.push(rap);
      }
    });

    return { noAsignados, porTrimestre };
  }, [sabana, mapaAsignaciones, mapaTrimestres]);

  const handleDropRAP = async (idRap, idTrimestre, asignacionAnterior = null) => {
    if (!fichaSeleccionada) {
      setError("Debe seleccionar una ficha primero");
      return;
    }

    const clave = `asignar-${idRap}-${idTrimestre}`;
    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      setError(null);

      console.log("Asignando RAP:", { idRap, idTrimestre, fichaSeleccionada });

      // 1. Si el RAP ya estaba asignado a otro trimestre, desasignarlo primero
      if (asignacionAnterior && asignacionAnterior.id_rap_trimestre) {
        try {
          console.log("Desasignando asignación anterior...");
          await desasignarRAP(asignacionAnterior.id_rap || idRap, asignacionAnterior.id_trimestre, fichaSeleccionada);
        } catch (err) {
          console.warn("Error al desasignar RAP anterior:", err);
        }
      }

      // 2. Asignar el RAP al nuevo trimestre
      console.log("Asignando nuevo RAP...");
      await asignarRAP(idRap, idTrimestre, fichaSeleccionada);

      // 3. Recargar todos los datos
      console.log("🔄 Recargando sábana completa...");
      await cargarSabana(fichaSeleccionada);

      console.log("🎉 RAP asignado exitosamente");
    } catch (err) {
      console.error("Error asignando RAP:", err);
      setError(`Error al asignar RAP: ${err.message}`);
    } finally {
      setProcesando((prev) => {
        const nuevo = new Set(prev);
        nuevo.delete(clave);
        return nuevo;
      });
    }
  };

  const handleDesasignarRAP = async (idRap, idTrimestre) => {
    if (!fichaSeleccionada) {
      setError("Debe seleccionar una ficha primero");
      return;
    }

    const clave = `desasignar-${idRap}-${idTrimestre}`;
    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      setError(null);

      console.log("Desasignando RAP:", { idRap, idTrimestre, fichaSeleccionada });

      await desasignarRAP(idRap, idTrimestre, fichaSeleccionada);

      console.log("Recargando sábana completa...");
      await cargarSabana(fichaSeleccionada);

      console.log("RAP desasignado exitosamente");
    } catch (err) {
      console.error("Error desasignando RAP:", err);
      setError(`Error al desasignar RAP: ${err.message}`);
    } finally {
      setProcesando((prev) => {
        const nuevo = new Set(prev);
        nuevo.delete(clave);
        return nuevo;
      });
    }
  };

  const obtenerNumeroTrimestres = () => {
    // Si ya tenemos trimestres cargados desde BD -> usar esos
    const cantidad = Object.keys(mapaTrimestres).length;

    if (cantidad > 0) return cantidad;

    // Caso extremo: no llegaron trimestres -> inferir por jornada
    const jornada = infoFicha?.jornada?.toLowerCase() || "";

    if (jornada.includes("noct")) return 9;
    return 7; // Diurna por defecto
  };

  const handleIrAlDashboard = () => {
    navigate("/instructor");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="sabana-layout-completo">
        <HeaderSabana ficha={infoFicha} programa={infoPrograma} gestor={user} />

        <div className="sabana-contenedor-con-sidebar">
          <Sidebar fichaInfo={infoFicha} />

          <div className="sabana-contenido-principal">
            <div className="sabana-contenedor">
              {!fichaSeleccionada && !cargando && (
                <div className="sabana-seleccion-ficha">
                  <div className="seleccion-ficha-content">
                    <h2>Selecciona una Ficha</h2>
                    <p>Para ver la sábana de una ficha, por favor selecciona una desde el dashboard del instructor.</p>
                    <button className="btn-ir-dashboard" onClick={handleIrAlDashboard}>
                      Ir al Dashboard
                    </button>
                  </div>
                </div>
              )}

              {fichaSeleccionada && (
                <>
                  <div className="sabana-header">
                    <h2 className="sabana-titulo">Gestión de Sábana</h2>
                    <p className="sabana-subtitulo">
                      Ficha ID: {fichaSeleccionada} - Asigna RAPs a trimestres usando drag & drop
                    </p>
                    <p className="sabana-instruccion">
                      💡 <strong>Tip:</strong> Haz clic en cualquier RAP para ver información detallada de su
                      competencia
                    </p>
                  </div>

                  {error && (
                    <div className="sabana-error">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {cargando && (
                    <div className="sabana-cargando">
                      <div className="spinner"></div>
                      Cargando información...
                    </div>
                  )}

                  {procesando.size > 0 && (
                    <div className="sabana-procesando">Procesando cambios... ({procesando.size})</div>
                  )}

                  {sabana && Array.isArray(sabana) && sabana.length > 0 ? (
                    <div className="sabana-kanban-contenedor">
                      <BandejaNoAsignados
                        raps={rapsOrganizados.noAsignados}
                        onDesasignarRAP={handleDesasignarRAP}
                        onClickRAP={handleClickRAP}
                      />

                      <div className="sabana-columnas-trimestres">
                        {Array.from({ length: obtenerNumeroTrimestres() }, (_, i) => {
                          const noTrimestre = i + 1;
                          const idTrimestre = obtenerIdTrimestre(noTrimestre);

                          if (!idTrimestre) return null;

                          const datosTrimestre = rapsOrganizados.porTrimestre[idTrimestre];
                          const rapsTrimestre = datosTrimestre ? datosTrimestre.raps : [];

                          return (
                            <ColumnaTrimestre
                              key={`trimestre-${noTrimestre}`}
                              noTrimestre={noTrimestre}
                              idTrimestre={idTrimestre}
                              raps={rapsTrimestre}
                              onDropRAP={handleDropRAP}
                              onDesasignarRAP={handleDesasignarRAP}
                              onClickRAP={handleClickRAP}
                              instructores={instructores}
                              onAsignarInstructor={handleAsignarInstructor}
                              asignandoInstructor={asignandoInstructor}
                              onCopiarRAP={copiarRAP}
                              onPegarRAP={pegarRAPEnTrimestre}
                              modoCopiar={modoCopiar}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !cargando &&
                    fichaSeleccionada && (
                      <div className="sabana-vacio">
                        <p>No hay RAPs disponibles para esta ficha.</p>
                        <p>La ficha puede no tener un programa asignado o no hay RAPs configurados.</p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {modalAbierto && (
          <ModalInfoRAP
            rap={rapSeleccionado}
            competencia={competenciaSeleccionada}
            rapsAsociados={rapsAsociados}
            onClose={cerrarModal}
          />
        )}
      </div>
    </DndProvider>
  );
};
