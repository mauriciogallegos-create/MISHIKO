const selectorMesaQr = document.getElementById('qr-mesa');
const imagenMesaQr = document.getElementById('qr-imagen');
const estadoMesaQr = document.getElementById('qr-estado');

for (const enlace of document.querySelectorAll('.mesa-qr-btn')) {
  const mesaId = new URL(enlace.href).searchParams.get('mesaId');
  selectorMesaQr.add(new Option(enlace.textContent.trim(), mesaId));
}

function mostrarQrMesa() {
  const mesa = selectorMesaQr.selectedOptions[0];
  imagenMesaQr.hidden = true;
  estadoMesaQr.textContent = 'Cargando código QR…';
  imagenMesaQr.alt = `Código QR de ${mesa.text}`;
  imagenMesaQr.onload = () => {
    imagenMesaQr.hidden = false;
    estadoMesaQr.textContent = 'Escanea para abrir el menú de esta mesa';
  };
  imagenMesaQr.onerror = () => {
    estadoMesaQr.textContent = 'No se pudo cargar el código QR. Puedes abrir la mesa con su enlace.';
  };
  imagenMesaQr.src = `${API_BASE}/mesas/${mesa.value}/qr`;
}

selectorMesaQr.addEventListener('change', mostrarQrMesa);
mostrarQrMesa();
