const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

// === CONFIGURACIÓN DEL BÚNKER PRIVADO ===
const GITHUB_USER = 'jav45dev-ctrl';
const GITHUB_REPO = 'str.ch.core1';
const NOMBRE_ARCHIVO = 's1.oz.101.dat.mp4';
const GITHUB_TOKEN = process.env.MI_TOKEN_SECRETO;

// === DATOS FÍSICOS REALES CALIBRADOS ===
const DURACION_SEGUNDOS = 3490; 

// Momento cero fijo en el pasado
const MOMENTO_CERO = new Date('2026-01-01T00:00:00Z').getTime();

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[RELOJ GHOST] Calculando segundo del vivo...");

        if (!GITHUB_TOKEN) {
            return res.status(500).send("Falta configuración.");
        }

        // 1. CALCULAMOS EL SEGUNDO EXACTO DEL VIVO
        const tiempoPasadoMilisej_ = Date.now() - MOMENTO_CERO;
        const segundosPasados = Math.floor(tiempoPasadoMilisej_ / 1000);
        const segundoActualDelVideo = segundosPasados % DURACION_SEGUNDOS;

        console.log(`[VIVO] El reloj marca el segundo: ${segundoActualDelVideo}`);

        // 2. PEDIMOS LOS DATOS DEL ASSET A GITHUB
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
        if (!asset) return res.status(404).send("Archivo no encontrado.");

        // 3. LA JUGADA MAESTRA: Conseguimos el link de descarga temporal que genera la API
        // Al pedirlo con la cabecera común, GitHub nos da una URL directa de su servidor de streaming (AWS/Azure)
        const respuestaRedirect = await axios({
            method: 'get',
            url: asset.url,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/octet-stream',
                'User-Agent': 'GHOSTtv-Engine'
            },
            maxRedirects: 0, // Le decimos que no siga la redirección, queremos cazar la URL final
            validateStatus: (status) => status >= 200 && status < 400 // Evitamos que tire error por el redireccionamiento 302
        });

        // Cazamos la URL de streaming oculta y temporal que nos da Microsoft
        const urlVideoReal = respuestaRedirect.headers.location || asset.browser_download_url;

        // 4. LE CLAVAMOS EL RELOJ NATIVO AL ENLACE Y REDIRIGIMOS
        // Sumamos el salto de tiempo al enlace final. Al ser servidores de alta velocidad, 
        // tu reproductor nativo ghostview va a interpretar el #t= y saltará al segundo exacto de forma fluida
        const enlaceFinalConTiempo = `${urlVideoReal}#t=${segundoActualDelVideo}`;
        
        console.log("[ÉXITO] Redirigiendo flujo al búnker de alta velocidad.");
        return res.redirect(302, enlaceFinalConTiempo);

    } catch (error) {
        console.error("Error crítico en el túnel horario:", error.message);
        return res.status(500).send("Error en la transmisión.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv activo en puerto ${PORT}`);
});
