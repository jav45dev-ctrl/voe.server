const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// =======================================================
// 🔑 TUS LLAVES DEL BÚNKER PRIVADO (Cambia estos 3 datos)
// =======================================================
const GITHUB_USER = 'jav45dev-ctrl'; // Tu usuario de GitHub
const GITHUB_REPO = 'str.ch.core1';    // Tu repositorio privado
const GITHUB_TOKEN = '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'; 
// (Nota: Si no tenés el Token, ahora te enseño a sacarlo en 10 segundos)

// Nombre exacto del archivo que subiste
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[TÚNEL GHOST] Conectando de forma segura al búnker privado...");

        // Configuración de cabeceras profesionales para IPTV nativo (Evita la descarga automática)
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Accept-Ranges', 'bytes');

        // Construimos la URL de descarga directa autenticada con tu Token
        const urlAutenticada = `https://${GITHUB_TOKEN}@://githubusercontent.com{GITHUB_USER}/${GITHUB_REPO}/main/releases/download/v1.0/${NOMBRE_ARCHIVO}`;
        
        // Si usaste la sección de Releases tradicional, la API de descarga directa segura es esta:
        const urlReleaseApi = `https://${GITHUB_TOKEN}@://github.com{GITHUB_USER}/${GITHUB_REPO}/releases/assets/LATEST`;

        // Render se conecta usando tu llave secreta
        const respuestaVideo = await axios({
            method: 'get',
            url: `https://://github.com{GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Buscamos el ID interno del archivo para descargarlo directo por API sin restricciones
        const asset = respuestaVideo.data.assets.find(a => a.name === NOMBRE_ARCHIVO);
        
        if (!asset) {
            console.log("[ERROR] No se encontró el archivo de video en la Release.");
            return res.status(404).send("Archivo no encontrado.");
        }

        // Descargamos el flujo crudo del video de forma privada
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

        // Abrimos la tubería directa hacia la app Ghost TV
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
