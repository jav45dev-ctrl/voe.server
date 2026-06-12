const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === CONFIGURACIÓN DE TU BÚNKER PRIVADO ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

// === DATOS REALES DE TU VIDEO DE REPRODUCCIÓN ===
const DURACION_SEGUNDOS = 3490; // Tus 58 min 10 seg exactos

// Momento de inicio fijo del canal para el reloj mundial continuo
const MOMENTO_CERO = new Date('2026-01-01T00:00:00Z').getTime();

// Almacenamos la URL temporal de alta velocidad para no saturar a GitHub
let urlStreamingCache = '';
let ultimaActualizacionCache = 0;

async function renovarEnlaceGitHub() {
    try {
        const ahora = Date.now();
        // Si el enlace en cache tiene menos de 2 horas, lo seguimos usando para que vuele la velocidad
        if (urlStreamingCache && (ahora - ultimaActualizacionCache < 7200000)) {
            return urlStreamingCache;
        }

        // Consultamos la API para sacar el enlace crudo de alta velocidad de Microsoft
        const infoRelease = await axios({
            method: 'get',
            url: `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'GHOSTtv-Engine'
            }
        });

        const asset = infoRelease.data.assets.find(a => a.name === NOMBRE_ARCHIVO);
        if (!asset) throw new Error("Video no encontrado");

        const respuestaRedirect = await axios({
            method: 'get', url: asset.url,
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/octet-stream', 'User-Agent': 'GHOSTtv-Engine' },
            maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 400
        });

        urlStreamingCache = respuestaRedirect.headers.location || asset.browser_download_url;
        ultimaActualizacionCache = ahora;
        console.log("[BÚNKER] Enlace de alta velocidad renovado con éxito.");
        return urlStreamingCache;
    } catch (error) {
        console.error("[ERROR] Al conectar con el búnker:", error.message);
        return urlStreamingCache; // Devolvemos el viejo como salvavidas
    }
}

// EL CAÑO DE EMISIÓN EN VIVO REAL (Para tu lista.m3u de Ghost TV)
app.get('/live.mp4', async (req, res) => {
    try {
        if (!GITHUB_TOKEN) return res.status(500).send("Falta token.");

        // 1. EL RELOJ INVISIBLE: Calculamos el segundo exacto de la grilla del día de hoy
        const segundosPasados = Math.floor((Date.now() - MOMENTO_CERO) / 1000);
        const segundoActualDelVivo = segundosPasados % DURACION_SEGUNDOS;

        console.log(`[EMISOR VIVO] Usuario conectado. Despachando señal continua en segundo: ${segundoActualDelVivo}`);

        // 2. OBTENEMOS EL VIDEO CRUDO DE ALTA VELOCIDAD
        const urlVideoReal = await renovarEnlaceGitHub();

        // 3. CABECERAS DE TRANSMISIÓN EN VIVO PROFESIONAL (Bloquea descargas y botones de play)
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate');

        // 4. LA TUBERÍA FLUIDA: Le pedimos a los servidores de alta velocidad el video arrancando desde el segundo exacto
        // Al usar un stream por tubería directa filtrada, el video arranca solo y no se puede pausar ni adelantar
        const respuestaStream = await axios({
            method: 'get',
            url: urlVideoReal,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Range': `bytes=${Math.floor((segundoActualDelVivo / DURACION_SEGUNDOS) * 291644493)}-`
            }
        });

        // El video viaja directo desde Microsoft a Render, y Render lo escupe continuo al usuario
        respuestaStream.data.pipe(res);

        req.on('close', () => {
            console.log("[EMISOR VIVO] Usuario se desconectó de la señal.");
            respuestaStream.data.destroy();
        });

    } catch (error) {
        console.error("Error en la manguera de datos continua:", error.message);
        return res.status(500).send("Error en el flujo en vivo.");
    }
});

app.listen(PORT, () => {
    console.log(`Estación GHOST en VIVO EMITIENDO CONTINUO en puerto ${PORT}`);
});
