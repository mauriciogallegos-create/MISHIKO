/**
 * notifications.js – Sistema de notificaciones MISHIKO
 * Usa Notification API del navegador + toasts internos
 */

const Notifications = {
  permisoSolicitado: false,

  /** Solicitar permiso para notificaciones del navegador */
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (this.permisoSolicitado) return Notification.permission;
    this.permisoSolicitado = true;
    return await Notification.requestPermission();
  },

  /**
   * Mostrar notificación del navegador (con fallback a toast)
   * @param {string} title
   * @param {string} body
   * @param {string} tipo - 'info'|'success'|'warning'|'error'
   */
  async show(title, body, tipo = 'info') {
    // Intentar notificación nativa
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '🐱';
      try {
        new Notification(`🐱 MISHIKO – ${title}`, {
          body,
          icon: '../assets/logo.svg',
          badge: '../assets/logo.svg',
          tag: 'mishiko-' + Date.now()
        });
      } catch (_) { /* fallback */ }
    }
    // Siempre mostrar toast interno también
    this.toast(`${title}: ${body}`, tipo);
  },

  /**
   * Toast animado en la página
   * @param {string} mensaje
   * @param {string} tipo - 'info'|'success'|'warning'|'error'
   * @param {number} duracion - ms
   */
  toast(mensaje, tipo = 'info', duracion = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    const icono = document.createElement('span');
    icono.textContent = icons[tipo] || 'ℹ️';
    const texto = document.createElement('span');
    texto.textContent = mensaje;
    toast.append(icono, texto);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, duracion);
  },

  /** Notificaciones según estado del pedido */
  notificarEstadoPedido(estado, numeroPedido) {
    const mensajes = {
      PENDIENTE:      { title: 'Pedido Recibido',    body: `Tu pedido ${numeroPedido} fue recibido.`,          tipo: 'info'    },
      CONFIRMADO:     { title: 'Pedido Confirmado',  body: `Tu pedido ${numeroPedido} fue confirmado.`,        tipo: 'success' },
      EN_PREPARACION: { title: 'En Preparación',     body: `Tu pedido ${numeroPedido} está en cocina 🍳`,     tipo: 'info'    },
      LISTO:          { title: '¡Pedido Listo!',     body: `Tu pedido ${numeroPedido} está listo. ¡A comer!`, tipo: 'success' },
      ENTREGADO:      { title: 'Pedido Entregado',   body: `¡Disfruta tu pedido ${numeroPedido}! 😋`,         tipo: 'success' },
      CANCELADO:      { title: 'Pedido Cancelado',   body: `Tu pedido ${numeroPedido} fue cancelado.`,        tipo: 'error'   }
    };
    const m = mensajes[estado];
    if (m) this.show(m.title, m.body, m.tipo);
  }
};

// Alias global
function mostrarToast(msg, tipo = 'info', duracion = 3000) {
  Notifications.toast(msg, tipo, duracion);
}
