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
const DURACION_SEGUNDOS = 3490; // 58 min 10 seg convertidos a segundos
const TAMANO_BYTES = 291644493; // Tu número exacto de bytes sin redondear


// Momento cero fijo en el pasado para que el reloj sea infinito y continuo
const MOMENTO_CERO = new Date('2026-01-01T00:00:00Z').getTime();

app.get('/live.mp4', async (req, res) => {
    try {
        console.log("[RELOJ GHOST] Calculando punto de emisión en vivo...");

        if (!GITHUB_TOKEN) {
            return res.status(500).send("Falta configuración de seguridad.");
        }

        // 1. EL RELOJ DE LA GRILLA: Calculamos en qué segundo del bucle estamos hoy
        const tiempoPasadoMilisej_ = Date.now() - MOMENTO_CERO;
        const segundosPasados = Math.floor(tiempoPasadoMilisej_ / 1000);
        const segundoActualDelVideo = segundosPasados % DURACION_SEGUNDOS;

        // 2. LA MAGIA MATEMÁTICA: Calculamos desde qué Byte tenemos que pedirle a GitHub
        const byteDeInicio = Math.floor((segundoActualDelVideo / DURACION_SEGUNDOS) * TAMANO_BYTES);

        console.log(`[VIVO] Emitiendo en segundo: ${segundoActualDelVideo}. Saltando al Byte: ${byteDeInicio}`);

        // Forzamos las cabeceras de IPTV para que la app no descargue el archivo
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 3. Buscamos el ID del archivo en la API de GitHub
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

        // 4. LA TUBERÍA CON RANGO: Le pedimos a Microsoft el video a partir del byte calculado
        const descargaStream = await axios({
            method: 'get',
            url: asset.url,
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/octet-stream',
                'Range': `bytes=${byteDeInicio}-`, // <--- ¡AQUÍ ESTÁ EL RELOJ DE BYTES!
                'User-Agent': 'GHOSTtv-Engine'
            }
        });

        // Enganchamos la manguera y el video sale disparado en el minuto correcto
        descargaStream.data.pipe(res);

        req.on('close', () => {
            descargaStream.data.destroy();
        });

    } catch (error) {
        console.error("Error crítico en el reloj del túnel:", error.message);
        return res.status(500).send("Error en la transmisión.");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GHOSTtv con Reloj Horario activo en puerto ${PORT}`);
});
