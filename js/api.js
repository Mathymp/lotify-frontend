const API_URL = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('userToken');

/**
 * Función para manejar respuestas de Fetch API.
 * Procesa la respuesta PRIMERO para ver si el servidor envió un mensaje de error específico.
 */
async function handleResponse(res) {
  let data = {};
  
  // 1. Intentamos obtener el mensaje del servidor (JSON)
  try {
      const resClone = res.clone(); // Clonamos por si necesitamos el texto crudo
      const text = await resClone.text();
      if (text.length > 0) {
          data = JSON.parse(text);
      }
  } catch (e) {
      // Si falla el JSON, data se queda vacío
  }

  // 2. Manejo de Errores HTTP
  if (!res.ok) {
      // CASO ESPECIAL: 401 (No autorizado)
      if (res.status === 401) {
          if (data.message) {
              throw new Error(data.message);
          }
          localStorage.removeItem('userToken');
          
          if (window.location.pathname.indexOf('index.html') === -1) {
              alert("⚠️ Sesión expirada. Por favor ingresa nuevamente.");
              window.location.href = 'index.html';
          }
          throw new Error('Sesión requerida');
      }

      const errorMessage = data.message || `Error del sistema: ${res.status}`;
      throw new Error(errorMessage);
  }

  return data;
}

/**
 * Wrapper de fetch para manejar errores de red (cuando el servidor está apagado).
 */
const safeFetch = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        return await handleResponse(res);
    } catch (e) {
        if (e.message.includes('Failed to fetch')) {
            throw new Error("❌ Error de conexión: El servidor no responde. Revisa si el backend está encendido.");
        }
        throw e;
    }
}


// --- FUNCIONES DE AUTENTICACIÓN ---

async function registerUser(nombre_usuario, email, password) {
  const data = await safeFetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario, email, password })
  });
  
  if (!data.token) throw new Error('Error: El servidor no devolvió un token válido.');
  return data;
}

async function loginUser(email, password) {
  const data = await safeFetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!data.token) throw new Error('Error: El servidor no devolvió un token válido.');
  return data;
}

// --- FUNCIONES DE PROYECTOS ---

async function getProjects() {
  return await safeFetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
}

async function createProject(formData) {
  // Nota: Al enviar FormData, no establezcas Content-Type manual (el navegador lo hace)
  const res = await fetch(`${API_URL}/projects`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  });
  return await handleResponse(res);
}

// --- NUEVA FUNCIÓN: ACTUALIZAR PROYECTO ---
async function updateProject(id, formData) {
    // Usamos PUT para actualizar
    const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT', // Asegúrate de que tu backend tenga esta ruta habilitada
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
    });
    return await handleResponse(res);
}

async function getProjectById(id) {
  return await safeFetch(`${API_URL}/projects/${id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
}

async function deleteProject(id) {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  // 204 No Content no tiene body, así que verificamos ok directamente
  if (!res.ok) await handleResponse(res);
}

// --- FUNCIONES DE LOTES ---

async function saveLote(loteData) {
    const res = await fetch(`${API_URL}/lotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(loteData)
    });
    return await handleResponse(res);
}

async function getLotes(projectId) {
    return await safeFetch(`${API_URL}/lotes/${projectId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
}

async function updateLote(id, loteData) {
    const res = await fetch(`${API_URL}/lotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(loteData)
    });
    return await handleResponse(res);
}

async function deleteLote(id) {
    const res = await fetch(`${API_URL}/lotes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) await handleResponse(res);
}