// services/authService.js
export const loginRequest = async (credentials) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Error en las credenciales');
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Error en loginRequest:", error);
    throw error;
  }
};