const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === CONFIGURACIÓN DE TU BÚNKER PRIVADO ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

// Duración exacta del bloque de Ozark en segundos
const DURACION_SEGUNDOS = 3490; 
const SEGMENTOS_TOTALES = 349; // Dividimos el video en bloques virtuales de 10 segundos
const DURACION_SEGMENTO = 10;

// Momento de inicio fijo del canal para el reloj continuo de la grilla
const MOMENTO_CERO = new Date('2026-01-01T00:00:00Z').getTime();

// 1. EL ÍNDICE MAESTRO EN VIVO (El archivo que lee tu app Ghost TV)
app.get('/live.m3u8', (req, res) => {
    const segundosPasados = Math.floor((Date.now() - MOMENTO_CERO) / 1000);
    const segundoActualGrilla = segundosPasados % DURACION_SEGUNDOS;
    const segmentoActual = Math.floor(segundoActualGrilla / DURACION_SEGMENTO);

    // Formateamos las cabeceras estándar de IPTV en vivo (HLS)
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Creamos el manifiesto dinámico de televisión. Le muestra al reproductor los 3 segmentos actuales en el aire
    let m3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${DURACION_SEGMENTO}\n#EXT-X-MEDIA-SEQUENCE:${segmentoActual}\n`;
    
    for (let i = 0; i < 3; i++) {
        let segId = (segmentoActual + i) % SEGMENTOS_TOTALES;
        m3u8 += `#EXTINF:${DURACION_SEGMENTO}.0,\nsegmento_${segId}.ts\n`;
    }

    return res.send(m3u8);
});

// 2. EL DESPACHADOR DE VIDEO (Usa :id para cumplir con las reglas de Node v24)
app.get('/segmento_:id.ts', async (req, res) => {
    try {
        // Capturamos el número de segmento de forma limpia
        const segId = parseInt(req.params.id);
        
        if (isNaN(segId)) return res.status(400).send("Segmento inválido.");

        const byteInicio = Math.floor((segId / SEGMENTOS_TOTALES) * 291644493);
        const byteFin = Math.floor(((segId + 1) / SEGMENTOS_TOTALES) * 291644493) - 1;

        res.setHeader('Content-Type', 'video/mp2t');

        // Solicitamos a la API el enlace temporal de alta velocidad de la Release
        const infoRelease = await axios({
            method: 'get',
            url: `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/tags/v1.0`,
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'GHOSTtv' }
        });
        const asset = infoRelease.data.assets.find(a => a.name === NOMBRE_ARCHIVO);
        if (!asset) return res.status(404).send("Video no encontrado.");
        
        const respuestaRedirect = await axios({
            method: 'get', url: asset.url,
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/octet-stream', 'User-Agent': 'GHOSTtv' },
            maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 400
        });
        const urlVideoReal = respuestaRedirect.headers.location || asset.browser_download_url;

        // Succionamos únicamente los bytes del mini fragmento de 10 segundos
        const descargaChunk = await axios({
            method: 'get',
            url: urlVideoReal,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0', 'Range': `bytes=${byteInicio}-${byteFin}` }
        });

        descargaChunk.data.pipe(res);
        req.on('close', () => descargaChunk.data.destroy());

    } catch (error) {
        console.error("Error en despacho de segmento:", error.message);
        return res.status(500).send("Error de flujo.");
    }
});

app.listen(PORT, () => console.log(`Transmisor HLS activo y seguro en puerto ${PORT}`));
