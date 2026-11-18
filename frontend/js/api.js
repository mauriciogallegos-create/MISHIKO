/**
 * api.js – Cliente HTTP para MISHIKO
 * Wrapper sobre fetch con manejo de JWT y errores
 */

const API_BASE = 'http://localhost:8080/api';

const api = {
  /**
   * Realiza una petición HTTP
   * @param {string} method - GET, POST, PUT, DELETE
   * @param {string} url - Ruta relativa (ej: '/productos')
   * @param {Object|null} data - Body de la petición
   * @param {boolean} auth - Si debe incluir el JWT
   */
  async request(method, url, data = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
      const token = Auth.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    try {
      const response = await fetch(API_BASE + url, config);

      // Si es 401, limpiar sesión y redirigir
      if (response.status === 401) {
        Auth.logout();
        return null;
      }

      // Intentar parsear JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const errorMsg = responseData?.message || responseData?.error || `Error ${response.status}`;
        throw new Error(errorMsg);
      }

      return responseData;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
      }
      throw error;
    }
  },

  get(url, auth = false)             { return this.request('GET',    url, null, auth); },
  post(url, data, auth = false)      { return this.request('POST',   url, data, auth); },
  put(url, data, auth = false)       { return this.request('PUT',    url, data, auth); },
  delete(url, auth = false)          { return this.request('DELETE', url, null, auth); },

  /** Descarga un archivo (PDF) */
  async downloadPdf(url, filename) {
    const token = Auth.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_BASE + url, { headers });
    if (!response.ok) throw new Error('No se pudo descargar el archivo');

    const blob = await response.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'comprobante.pdf';
    a.click();
    URL.revokeObjectURL(a.href);
  }
};
