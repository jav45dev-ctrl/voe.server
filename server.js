const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === CONFIGURACIÓN DE TU REPOSITORIO PRIVADO ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[TÚNEL GHOST] Iniciando consulta de seguridad a la API...");

        if (!GITHUB_TOKEN) {
            console.error("[ERROR] Falta configurar la variable MI_TOKEN_SECRETO en Render.");
            return res.status(500).send("Falta configuración.");
        }

        // Forzamos cabeceras de streaming continuo para evitar descargas en la app
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 1. Le pedimos a la API los datos del lanzamiento v1.0 de forma oficial
        const infoRelease = await axios({
            method: 'get',
            url: `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'GHOSTtv-Engine'
            }
        });

        // 2. Buscamos el ID numérico que GitHub le asignó a tu archivo de video
        const asset = infoRelease.data.assets.find(a => a.name === NOMBRE_ARCHIVO);
        
        if (!asset) {
            console.log("[ERROR] El archivo de video no existe en el lanzamiento v1.0.");
            return res.status(404).send("Archivo no encontrado.");
        }

        console.log(`[ÉXITO] ID del video encontrado: ${asset.id}. Conectando tubería...`);

        // 3. Conectamos la manguera directo al servidor secundario usando la cabecera octet-stream
        const descargaStream = await axios({
            method: 'get',
            url: `https://github.com{GITHUB_USER}/${GITHUB_REPO}/releases/assets/${asset.id}`,
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/octet-stream',
                'User-Agent': 'GHOSTtv-Engine'
            }
        });

        // 4. Los datos fluyen en tiempo real desde Microsoft hacia Render y de ahí al usuario
        descargaStream.data.pipe(res);

        req.on('close', () => {
            console.log("[TÚNEL GHOST] Transmisión cerrada por el usuario.");
            descargaStream.data.destroy();
        });

    } catch (error) {
        console.error("Error crítico en el túnel de la API:", error.message);
        return res.status(500).send("Error interno en la señal.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv operando en puerto ${PORT}`);
});
