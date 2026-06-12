const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === CONFIGURACIÓN DE TU BÚNKER PRIVADO ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

// === TU GRILLA DIARIA: Solo pones los nombres de los archivos en orden ===
// El proyeccionista los va a reproducir uno detrás del otro de forma infinita
const GRILLA_VIDEOS = [
    's1.oz.101.dat.mp4',
    // 'promo_3min.dat.mp4',  <-- Así vas a ir agregando tus tandas musicales o comerciales
    // 's1.oz.102.dat.mp4'
];

let indiceActual = 0;

// Función secreta que obtiene la URL de streaming cruda de GitHub usando tu token
async function obtenerUrlVideo(nombreArchivo) {
    const infoRelease = await axios({
        method: 'get',
        url: `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'GHOSTtv-Engine'
        }
    });
    const asset = infoRelease.data.assets.find(a => a.name === nombreArchivo);
    if (!asset) throw new Error("Archivo no encontrado en búnker");
    
    const respuestaRedirect = await axios({
        method: 'get', url: asset.url,
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/octet-stream', 'User-Agent': 'GHOSTtv-Engine' },
        maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 400
    });
    return respuestaRedirect.headers.location || asset.browser_download_url;
}

// El Punto de Emisión en Vivo Continuo (La manguera masiva)
app.get('/live.mp4', async (req, res) => {
    console.log("[PROYECCIONISTA GHOST] Un usuario se colgó a la transmisión en vivo.");

    // Forzamos cabeceras de IPTV pura: NO descarga, SÍ reproduce en pantalla completa
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const archivoActual = GRILLA_VIDEOS[indiceActual];
        const urlVideoReal = await obtenerUrlVideo(archivoActual);

        // FFmpeg en Render actúa como el proyeccionista: lee a velocidad real (-re)
        // Hace copia directa sin quemar CPU (-c copy) y lo manda en formato stream continuo (-f mp4)
        const proyeccionista = spawn('ffmpeg', [
            '-re',
            '-i', urlVideoReal,
            '-c', 'copy',
            '-f', 'mp4',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            '-'
        ]);

        // Enganchamos la tubería directo al usuario
        proyeccionista.stdout.pipe(res);

        // Si el proyeccionista termina el video, saltamos automáticamente al siguiente archivo de la lista
        proyeccionista.on('close', () => {
            indiceActual = (indiceActual + 1) % GRILLA_VIDEOS.length;
            console.log(`[PROYECCIONISTA] Video terminado. Siguiente en grilla: ${GRILLA_VIDEOS[indiceActual]}`);
        });

        // Si el usuario cierra la app, soltamos el proceso para no consumir de más
        req.on('close', () => {
            proyeccionista.kill();
        });

    } catch (error) {
        console.error("Error en el proyeccionista continuo:", error.message);
        return res.status(500).send("Error en la señal.");
    }
});

app.listen(PORT, () => {
    console.log(`Estación GHOST en VIVO EMITIENDO en puerto ${PORT}`);
});
