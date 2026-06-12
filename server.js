const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === TUS DATOS DEL BÚNKER ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[TÚNEL GHOST] Conectando directo al archivo privado...");

        // Forzamos cabeceras de IPTV para que el reproductor nativo lo lea en pantalla completa
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Construimos el enlace directo "Raw" inyectándole tu Token de seguridad
        // Este link va directo al grano saltándose toda la burocracia de las APIs de GitHub
        const urlDirectaRaw = `https://${GITHUB_TOKEN}@://githubusercontent.com{GITHUB_USER}/${GITHUB_REPO}/main/releases/download/v1.0/${NOMBRE_ARCHIVO}`;

        // Render abre la tubería directa
        const respuestaVideo = await axios({
            method: 'get',
            url: urlDirectaRaw,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        respuestaVideo.data.pipe(res);

        req.on('close', () => {
            respuestaVideo.data.destroy();
        });

    } catch (error) {
        console.error("Error en túnel directo:", error.message);
        return res.status(500).send("Error en la señal.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor operando en puerto ${PORT}`);
});
