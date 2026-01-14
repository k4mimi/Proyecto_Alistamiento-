// URL base del backend API
const API_BASE_URL = '/api';

export const obtenerSabanaPorFicha = async (idFicha) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sabana/matriz/${idFicha}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener sábana: ${response.status} ${response.statusText}`);
    }

    const respuesta = await response.json();
    if (respuesta.success && respuesta.data) {
      return respuesta.data;
    } else {
      throw new Error(respuesta.mensaje || 'Error al obtener sábana');
    }
  } catch (error) {
    console.error('Error en obtenerSabanaPorFicha:', error);
    throw error;
  }
};

export const obtenerTrimestres = async (idFicha) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sabana/trimestres/${idFicha}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Error al obtener trimestres: ${response.status}`);
    const respuesta = await response.json();
    if (respuesta.success && respuesta.data) return respuesta.data;
    throw new Error(respuesta.mensaje || 'Error al obtener trimestres');
  } catch (error) {
    console.error('Error en obtenerTrimestres:', error);
    throw error;
  }
};

/**
 * Obtener el instructor asignado a un RAP específico en una ficha y trimestre
 * @param {number} idFicha - ID de la ficha
 * @param {number} idRap - ID del RAP
 * @param {number} idTrimestre - ID del trimestre
 * @returns {Promise<Object>} - Información del instructor asignado
 */
export const obtenerInstructorPorRAP = async (idFicha, idRap, idTrimestre) => {
  console.log(`🔍 Buscando instructor para RAP ${idRap}, ficha ${idFicha}, trimestre ${idTrimestre}`);
  
  // USAR DIRECTAMENTE LA SÁBANA COMPLETA - NO INTENTAR ENDPOINT QUE NO EXISTE
  try {
    // Obtener sábana completa
    const sabana = await obtenerSabanaPorFicha(idFicha);
    
    if (!sabana || !Array.isArray(sabana)) {
      console.warn(`⚠️ Sábana no válida para ficha ${idFicha}`);
      return null;
    }
    
    // Buscar el RAP específico en la sábana
    const rapEnSabana = sabana.find(item => {
      // Buscar por diferentes campos posibles
      return item.id_rap === idRap || 
             item.id === idRap || 
             item.rap_id === idRap;
    });
    
    if (!rapEnSabana) {
      console.log(`📭 RAP ${idRap} no encontrado en sábana de ficha ${idFicha}`);
      return null;
    }
    
    // Verificar si existe instructor para este trimestre específico
    const trimestreKey = `t${idTrimestre}`;
    
    // Buscar instructor por diferentes posibles nombres de campo
    const instructorId = rapEnSabana[`${trimestreKey}_id_instructor`];
    const instructorNombre = rapEnSabana[`${trimestreKey}_instructor`];
    
    if (instructorId) {
      console.log(`✅ Instructor encontrado para RAP ${idRap}: ${instructorNombre || 'Instructor asignado'}`);
      return {
        id_instructor: instructorId,
        nombre: instructorNombre || 'Instructor asignado',
        apellido: '',
        asignado_en_sabana: true
      };
    }
    
    // Si no hay instructor para este trimestre
    console.log(`📝 RAP ${idRap} no tiene instructor asignado en trimestre ${idTrimestre}`);
    return null;
    
  } catch (error) {
    console.warn(`🌐 Error obteniendo instructor para RAP ${idRap} desde sábana:`, error.message);
    return null;
  }
};

export const asignarRAP = async (idRap, idTrimestre, idFicha, move = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sabana/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_rap: idRap,
        id_trimestre: idTrimestre,
        id_ficha: idFicha,
        move
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error al asignar RAP: ${response.status}`);
    }

    const respuesta = await response.json();
    if (respuesta.success) {
      return respuesta.sabana || respuesta.data || respuesta;
    } else {
      throw new Error(respuesta.mensaje || 'Error al asignar RAP');
    }
  } catch (error) {
    console.error('Error en asignarRAP:', error);
    throw error;
  }
};

export const desasignarRAP = async (idRap, idTrimestre, idFicha) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sabana/unassign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_rap: idRap,
        id_trimestre: idTrimestre,
        id_ficha: idFicha,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error al desasignar RAP: ${response.status}`);
    }

    const respuesta = await response.json();
    if (respuesta.success) {
      return respuesta.sabana || respuesta.data || respuesta;
    } else {
      throw new Error(respuesta.mensaje || 'Error al desasignar RAP');
    }
  } catch (error) {
    console.error('Error en desasignarRAP:', error);
    throw error;
  }
};

export const obtenerInstructoresPorFicha = async (idFicha) => {
  const response = await fetch(`${API_BASE_URL}/sabana/instructores/${idFicha}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`Error al obtener instructores: ${response.status}`);
  const respuesta = await response.json();
  return respuesta.data || [];
};

/**
 * Asignar instructor usando id_rap_trimestre (PATCH /sabana/assign-instructor)
 * Body: { id_rap_trimestre, id_instructor }
 */
export const asignarInstructor = async (idRapTrimestre, idInstructor) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sabana/assign-instructor`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_rap_trimestre: idRapTrimestre,
        id_instructor: idInstructor
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.mensaje || `Error al asignar instructor: ${response.status}`);
    }

    const respuesta = await response.json();
    if (respuesta.success) {
      return respuesta.data || respuesta;
    } else {
      throw new Error(respuesta.mensaje || 'Error al asignar instructor');
    }
  } catch (error) {
    console.error('Error en asignarInstructor:', error);
    throw error;
  }
};

export const desasignarInstructor = async (idRapTrimestre) => {
  const response = await fetch(`${API_BASE_URL}/sabana/unassign-instructor`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_rap_trimestre: idRapTrimestre }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensaje || `Error al desasignar instructor: ${response.status}`);
  }

  return response.json();
};