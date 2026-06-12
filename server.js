const express = require('express');
const app = express();

// Puerto dinámico para Render o 8080 para desarrollo local.
const PORT = process.env.PORT || 8080;

// === LINK DEL VIDEO REDIRIGIDO ===
const VIDEO_DIRECTO_MP4 = 'https://ugc-cdn-caching-n3dykgb0psbvigeweq.cloudwindow-route.com/engine/hls2/01/17457/im8lddlisfdo_,n,.urlset/index-v1-a1.m3u8?t=-vJzq0haAwsG9pLgSjKQqzaKpH1DX6yMc5gbFXE3MsY&s=1781248752&e=14400&f=87286194&node=zXGMiz1sWXdxYQgKybz3KDQHYomsDJS9PQuwgdh8DZ4=&i=179.29&sp=2500&asn=6057&q=n&rq=oDJoxyPqlD38FVEEeioOeoVsiNcau6qgx5axThOQ'; 
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
