import { useState, useEffect } from "react";
import "./Pagina.css";
import { ModalFicha } from "../components/ui/ModalFicha";

export const FichasPagina = () => {
  const [fichas, setFichas] = useState([]);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [programas, setProgramas] = useState([]);

  //  Cargar fichas reales desde el backend
  useEffect(() => {
    cargarFichas();
    cargarProgramas();
  }, []);

  const cargarFichas = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/fichas");
      const data = await res.json();
      setFichas(data);
    } catch (error) {
      console.error("Error cargando fichas:", error);
    }
  };

  const cargarProgramas = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/programas");
      const data = await res.json();
      setProgramas(data);
    } catch (error) {
      console.error("Error cargando programas:", error);
    }
  };

  // Abrir modal (nuevo o edición)
  const abrirModal = (ficha = null) => {
    setFichaSeleccionada(ficha);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setFichaSeleccionada(null);
    setMostrarModal(false);
  };

  //  Guardar en backend real
  const guardarFicha = async (data) => {
    try {

      // Preparar datos para el backend
      const fichaData = {
        id_programa: data.codigoPrograma,
        codigo_ficha: data.codigoFicha,
        modalidad: data.modalidad,
        jornada: data.jornada,
        ambiente: data.ubicacion,
        fecha_inicio: data.fechaInicio,
        fecha_final: data.fechaFin,
        cantidad_trimestre: data.cantidad_trimestre,
        id_instructor: data.instructores && data.instructores.length > 0 
          ? data.instructores[0] 
          : null
      };


      const url = "http://localhost:3000/api/fichas";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fichaData)
      });

      if (!res.ok) throw new Error("Error guardando ficha");

      const resultado = await res.json();

      // Recargar fichas desde backend
      cargarFichas();
      cerrarModal();

    } catch (error) {
      console.error(" [FRONTEND] Error guardando ficha:", error);
      alert("Error al guardar la ficha: " + error.message);
    }
  };

  //  Cambiar estado en backend
  const toggleEstado = async (id) => {
    try {
      cargarFichas();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  return (
    <div className="pagina-contenedor">
      {/* Header */}
      <div className="pagina-header">
        <h2 className="pagina-titulo">Gestión de Fichas</h2>
        <p className="pagina-subtitulo">
          Administra las fichas asociadas a los programas de formación
        </p>
      </div>

      {/* Botón Crear */}
      <div className="pagina-boton-contenedor">
        <button className="pagina-boton" onClick={() => abrirModal()}>
          + Crear Ficha
        </button>
      </div>

      {/* Lista */}
      <div className="lista-usuarios">
        <h3 className="lista-titulo">
          Lista de Fichas{" "}
          <span className="lista-subtexto">{fichas.length} registradas</span>
        </h3>

        {fichas.length > 0 ? (
          <div className="usuarios-contenedor">
            {fichas.map((ficha) => (
              <div key={ficha.id_ficha} className="usuario-card">
                <div className="usuario-info-contenedor">
                  <div className="usuario-info">
                    <p className="usuario-nombre">{ficha.codigo_ficha}</p>
                    <p className="usuario-email">{ficha.nombre_programa}</p>
                  </div>
                </div>
                <div className="usuario-detalles">
                  <span className="usuario-estado activo">
                    Activa
                  </span>
                  <div className="usuario-acciones">
                    <button
                      className="boton-editar"
                      onClick={() => abrirModal(ficha)}
                    >
                      Editar
                    </button>
                    <button
                      className="boton-estado boton-inhabilitar"
                      onClick={() => toggleEstado(ficha.id_ficha)}
                    >
                      Inhabilitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="tabla-vacia">No hay fichas registradas</p>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <ModalFicha
          onClose={cerrarModal}
          onSave={guardarFicha}
          fichaSeleccionada={fichaSeleccionada}
          programas={programas}
        />
      )}
    </div>
  );
};