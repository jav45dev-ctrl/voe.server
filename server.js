const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// =======================================================
// 🔑 CONFIGURACIÓN SEGURA DEL BÚNKER PRIVADO
// =======================================================
const GITHUB_USER = 'jav45dev-ctrl'; // Tu usuario de GitHub
const GITHUB_REPO = 'str.ch.core1';    // Tu repositorio privado
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4'; // El nombre de tu video

// Leemos el token de forma segura desde las variables de entorno de Render
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[TÚNEL GHOST] Conectando de forma segura al búnker privado...");

        if (!GITHUB_TOKEN) {
            console.error("[ERROR] No se configuró la variable MI_TOKEN_SECRETO en Render.");
            return res.status(500).send("Falta configuración de seguridad.");
        }

        // Configuración de cabeceras profesionales para IPTV nativo (Evita la descarga automática)
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Accept-Ranges', 'bytes');

        // 1. Render se conecta a la API de GitHub usando tu llave secreta oculta
        const respuestaVideo = await axios({
            method: 'get',
            url: `https://github.com{GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // 2. Buscamos el ID interno del archivo para descargarlo directo por API sin restricciones
        const asset = respuestaVideo.data.assets.find(a => a.name === NOMBRE_ARCHIVO);
        
        if (!asset) {
            console.log("[ERROR] No se encontró el archivo de video en la Release.");
            return res.status(404).send("Archivo no encontrado.");
        }

        // 3. Descargamos el flujo crudo del video de forma privada
        const descargaStream = await axios({
            method: 'get',
            url: asset.url,
            responseType: 'stream',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/octet-stream',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // 4. Abrimos la manguera directa de datos hacia la app Ghost TV
        descargaStream.data.pipe(res);

        req.on('close', () => {
            console.log("[TÚNEL GHOST] Conexión cerrada por el usuario.");
            descargaStream.data.destroy();
        });

    } catch (error) {
        console.error("Error crítico en el túnel autenticado:", error.message);
        return res.status(500).send("Error en la señal. Verifica el Token.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv autenticado activo en puerto ${PORT}`);
});
