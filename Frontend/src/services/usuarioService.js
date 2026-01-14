const API_URL = "http://localhost:3000/api/instructores";

// 🔹 Leer todos los instructores
export const leerUsuarios = async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("⚠️ Error del backend (leerUsuarios):", errorText);
      throw new Error("Error al leer usuarios");
    }
    return await res.json();
  } catch (error) {
    console.error("❌ Error en leerUsuarios:", error);
    return [];
  }
};

// 🔹 Crear un nuevo instructor
export const crearUsuario = async (usuario) => {
  try {
    console.log("📤 Datos recibidos para CREAR:", usuario);
    
    // Convertir tipos de datos para asegurar compatibilidad con el backend
    const usuarioCompleto = {
      ...usuario,
      id_rol: Number(usuario.id_rol) || 2, // Convertir a número
      estado: Number(usuario.estado) || 1, // Convertir a número
    };

    console.log("📤 Datos procesados para enviar:", usuarioCompleto);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioCompleto),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("⚠️ Error del backend al crear:", errorText);
      throw new Error(errorText || "Error al crear usuario");
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Error en crearUsuario:", error);
    throw error;
  }
};

// 🔹 Actualizar instructor (CORREGIDO)
export const actualizarUsuario = async (usuario) => {
  try {
    console.log("📤 Datos recibidos para ACTUALIZAR:", usuario);
    
    // El ID podría venir como id_instructor o simplemente id
    const usuarioId = usuario.id_instructor || usuario.id;
    
    if (!usuarioId) {
      throw new Error("ID de usuario no proporcionado");
    }

    console.log("🎯 ID del usuario a actualizar:", usuarioId);

    // ✅ PREPARAR DATOS CORRECTAMENTE: Convertir tipos
    const datosParaEnviar = {
      cedula: String(usuario.cedula || "").trim(),
      nombre: String(usuario.nombre || "").trim(),
      email: String(usuario.email || "").trim().toLowerCase(),
      // Solo incluir contraseña si se proporcionó una nueva (y no está vacía)
      ...(usuario.contrasena && usuario.contrasena.trim() !== "" && { 
        contrasena: usuario.contrasena 
      }),
      // Convertir a número - IMPORTANTE
      id_rol: Number(usuario.id_rol) || 2,
      estado: Number(usuario.estado) || 1
    };

    console.log("🎯 Datos procesados para enviar:", datosParaEnviar);
    console.log("🎯 Tipo de id_rol:", typeof datosParaEnviar.id_rol, "valor:", datosParaEnviar.id_rol);

    const res = await fetch(`${API_URL}/${usuarioId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosParaEnviar),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("⚠️ Error del backend al actualizar:", errorText);
      
      // Intentar parsear como JSON si es posible
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || errorData.mensaje || `Error ${res.status}: ${errorText}`);
      } catch {
        throw new Error(`Error al actualizar usuario: ${res.status} - ${errorText}`);
      }
    }

    const result = await res.json();
    console.log("✅ Usuario actualizado exitosamente:", result);
    return result;

  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    throw error;
  }
};

// 🔹 Eliminar instructor
export const eliminarUsuario = async (id) => {
  try {
    console.log("🗑️ Eliminando usuario ID:", id);
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("⚠️ Error del backend al eliminar:", errorText);
      throw new Error(errorText || "Error al eliminar usuario");
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Error en eliminarUsuario:", error);
    throw error;
  }
};

// 🔹 Buscar usuario por ID (nueva función útil)
export const buscarUsuarioPorId = async (id) => {
  try {
    const usuarios = await leerUsuarios();
    return usuarios.find(u => u.id_instructor == id || u.id == id);
  } catch (error) {
    console.error("❌ Error en buscarUsuarioPorId:", error);
    return null;
  }
};