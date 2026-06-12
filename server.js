const express = require('express');
const app = express();

// Puerto dinámico para Render o 8080 para desarrollo local.
const PORT = process.env.PORT || 8080;

// === LINK DEL VIDEO REDIRIGIDO ===
const VIDEO_DIRECTO_MP4 = 'https://cloudwindow-route.com'; 

// Duración del contenido en segundos (45 minutos por defecto)
const DURACION_VIDEO_SEGUNDOS = 2700; 

const TIEMPO_INICIO_CANAL = Date.now();

app.get('/live.mp4', (req, res) => {
    try {
        const segundosDesdeInicio = Math.floor((Date.now() - TIEMPO_INICIO_CANAL) / 1000);
        const segundoActualDelVideo = segundosDesdeInicio % DURACION_VIDEO_SEGUNDOS;
        
        const enlaceFinal = `${VIDEO_DIRECTO_MP4}#t=${segundoActualDelVideo}`;
        
        console.log(`[STREAM] Redirigiendo transmisión en el segundo: ${segundoActualDelVideo}`);
        
        return res.redirect(302, enlaceFinal);
    } catch (error) {
        console.error("Error crítico:", error.message);
        return res.status(500).send("Error interno.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}. Transmitiendo enlace directo...`);
});
