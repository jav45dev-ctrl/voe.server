const express = require('express');
const axios = require('axios'); // Asegurate de tener axios instalado
const app = express();

const PORT = process.env.PORT || 8080;

// ==========================================
// 🛡️ TUS ENLACES PERMANENTES DE PÁGINA (VOE)
// ==========================================
// Pegá acá el enlace corto normal de la página de Voe (el que NO vence nunca)
const URL_CAPITULO_OZARK = 'https://voe.sx/im8lddlisfdo'; 

// (Reservado para tus futuros bloques de programación)
const URL_BLOQUE_DOCUMENTAL = 'https://voe.cx'; 
const URL_BLOQUE_ADULTOS     = 'https://voe.cx'; 

// Duración de tu contenido de prueba en segundos (45 minutos)
const DURACION_VIDEO_SEGUNDOS = 2700; 

// Momento de inicio global del canal
const TIEMPO_INICIO_CANAL = Date.now();

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[EXTRACTOR] Simulando DownloadHelper para limpiar anuncios...");
        
        // 1. El servidor Express entra por detrás a la página web de Voe
        const respuesta = await axios.get(URL_CAPITULO_OZARK, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            }
        });
        
        const html = respuesta.data;

        // 2. Buscamos el archivo de video oculto dentro del código de la página
        const regexVideo = /(https:\/\/[^"']+\.mp4[^"']*)/;
        const coincidencia = html.match(regexVideo);

        let videoLimpioDirecto = '';
        
        if (coincidencia && coincidencia[1]) {
            videoLimpioDirecto = coincidencia[1];
            console.log("[ÉXITO] .mp4 extraído automáticamente sin publicidad.");
        } else {
            console.log("[ALERTA] Falló la extracción automática. Usando enlace de respaldo.");
            // Enlace de respaldo por si el extractor falla en algún momento
            videoLimpioDirecto = 'https://cloudwindow-route.com';
        }

        // 3. Calculamos la matemática del falso vivo
        const segundosDesdeInicio = Math.floor((Date.now() - TIEMPO_INICIO_CANAL) / 1000);
        const segundoActualDelVideo = segundosDesdeInicio % DURACION_VIDEO_SEGUNDOS;
        
        // 4. Armamos el enlace final con el salto de tiempo exacto
        const enlaceConTiempo = `${videoLimpioDirecto}#t=${segundoActualDelVideo}`;
        
        console.log(`[STREAM] Redirigiendo transmisión en el segundo: ${segundoActualDelVideo}`);
        
        // Redirección 302 directa a pantalla completa
        return res.redirect(302, enlaceConTiempo);

    } catch (error) {
        console.error("Error crítico en el sistema:", error.message);
        return res.status(500).send("Error interno.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv activo en puerto ${PORT}.`);
});
