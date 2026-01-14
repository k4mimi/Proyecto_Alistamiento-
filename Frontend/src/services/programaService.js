// src/services/programaService.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

export const programaService = {
    // Obtener todos los programas
    async obtenerProgramas() {
        try {
            const response = await fetch(`${API_BASE_URL}/programas`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al obtener programas:', error);
            throw error;
        }
    },

    // Eliminar programa (eliminará también todas sus fichas y datos relacionados)
    async eliminarPrograma(id) {
        try {
            console.log(`🗑️ Enviando solicitud para eliminar programa ID: ${id}`);
            
            const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log('✅ Respuesta del servidor:', resultado);
            return resultado;

        } catch (error) {
            console.error('Error al eliminar programa:', error);
            throw error;
        }
    },

    // Obtener programa por ID (opcional)
    async obtenerProgramaPorId(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al obtener programa:', error);
            throw error;
        }
    },

    // Crear programa (opcional)
    async crearPrograma(datos) {
        try {
            const response = await fetch(`${API_BASE_URL}/programas`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al crear programa:', error);
            throw error;
        }
    }
};