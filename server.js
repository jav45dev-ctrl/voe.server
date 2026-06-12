const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === TU ENLACE BASE DE GITHUB ===
const VIDEO_GITHUB = 'https://github.com/jav45dev-ctrl/str.ch.core1/releases/download/v1.0/s1.oz.101.dat.mp4';

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[TÚNEL GHOST] Creando flujo continuo para evadir bloqueo de GitHub...");

        // 1. Configuramos las cabeceras de IPTV pura para que NO descargue y SÍ reproduzca
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Accept-Ranges', 'bytes');

        // 2. Render se conecta a GitHub simulando un navegador autorizado
        const respuestaVideo = await axios({
            method: 'get',
            url: VIDEO_GITHUB,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // 3. Conectamos la manguera: los datos que entran de GitHub salen directo al usuario
        respuestaVideo.data.pipe(res);

        // Si el usuario cierra la app o cambia de canal, cortamos la manguera para no consumir recursos
        req.on('close', () => {
            console.log("[TÚNEL GHOST] Conexión cerrada por el usuario.");
            respuestaVideo.data.destroy();
        });

    } catch (error) {
        console.error("Error crítico en el túnel de transmisión:", error.message);
        return res.status(500).send("Error interno en la señal.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv operando en modo Túnel Seguro en puerto ${PORT}`);
});
