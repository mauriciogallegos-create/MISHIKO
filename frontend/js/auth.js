/**
 * auth.js – Gestión de autenticación JWT para MISHIKO
 */

const Auth = {
  TOKEN_KEY: 'mishiko_token',
  USER_KEY:  'mishiko_user',

  setToken(token) { localStorage.setItem(this.TOKEN_KEY, token); },
  getToken()      { return localStorage.getItem(this.TOKEN_KEY); },

  setUser(user)   { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); },
  getUser()       { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); },

  isLoggedIn()    { return !!this.getToken(); },

  hasRole(role) {
    const user = this.getUser();
    return user && user.rol === role;
  },

  isAdmin()     { return this.hasRole('ADMIN'); },
  isPersonal()  { return this.hasRole('PERSONAL') || this.isAdmin(); },
  isCocina()    { return this.hasRole('COCINA') || this.isAdmin(); },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '../login.html';
  },

  /**
   * Protege una página: si no está logueado redirige al login.
   * @param {string[]} roles - Roles permitidos (vacío = cualquier auth)
   */
  requireAuth(roles = []) {
    if (!this.isLoggedIn()) {
      window.location.href = '../login.html';
      return false;
    }
    if (roles.length > 0) {
      const user = this.getUser();
      if (!user || !roles.includes(user.rol)) {
        alert('No tienes permiso para acceder a esta página.');
        window.history.back();
        return false;
      }
    }
    return true;
  }
};
