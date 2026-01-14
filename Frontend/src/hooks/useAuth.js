import { useState, useEffect } from "react";
import { loginRequest } from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Cargar usuario desde localStorage si ya hay token
  useEffect(() => {
    if (token && !user) {
      const raw = localStorage.getItem("user");

      try {
        const storedUser = raw ? JSON.parse(raw) : null;
        if (storedUser) setUser(storedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, [token, user]);

  const login = async (email, password) => {
    try {

      const data = await loginRequest({ email, password });

      if (!data || !data.token) {
        console.error(" No se recibió token del backend");
        return false;
      }

      // Guardar token
      localStorage.setItem("token", data.token);
      setToken(data.token);

      //  VERIFICAR: El backend envía "instructor" no "user"
      const userData = data.instructor;

      if (userData) {

        const userToStore = {
          ...userData,
          // Asegurar que primer_acceso esté presente
          primer_acceso: userData.primer_acceso !== undefined ? userData.primer_acceso : true
        };


        setUser(userToStore);
        localStorage.setItem("user", JSON.stringify(userToStore));
      } else {
        console.error(" No se recibió datos del instructor");
      }

      return true;
    } catch (error) {
      console.error(" Error completo en login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("instructor");
  };

  return { user, token, login, logout };
};