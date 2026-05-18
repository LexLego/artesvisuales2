let audioCtx = null;
let masterGain = null;

let sistemaActivo = false;

const sonidosActivos = new Map();

const btn = document.getElementById('btnRitual');
const versos = document.querySelectorAll('.verso-sintetizador');


// =========================
// INIT AUDIO
// =========================
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
}


// =========================
// CREAR SONIDO BASE
// =========================
function crearSonido(tipo, elemento) {

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    const t = audioCtx.currentTime;

    let baseFreq = 220;
    let volumen = 0.05;

    // -------------------------
    // TIPOS SONOROS
    // -------------------------
   if (tipo === 'chispa') {
    osc.type = 'sawtooth';
    baseFreq = Math.random() * 400 + 400;
    volumen = 0.16;
}

if (tipo === 'raiz') {
    osc.type = 'triangle';
    const notas = [261.63, 293.66, 329.63, 392.00];
    baseFreq = notas[Math.floor(Math.random() * notas.length)];
    volumen = 0.20;
}

if (tipo === 'sky') {
    osc.type = 'sine';
    baseFreq = 220;
    volumen = 0.24;
}

    osc.frequency.setValueAtTime(baseFreq, t);

    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(volumen, t + 0.4);

    osc.start(t);

    return { osc, gainNode, baseFreq, volumen };
}


// =========================
// TOGGLE SONORO
// =========================
function toggleSonido(elemento) {

    const tipo = elemento.getAttribute('data-tipo');
    const t = audioCtx.currentTime;

    // apagar si existe
    if (sonidosActivos.has(elemento)) {

        const sonido = sonidosActivos.get(elemento);

        try {
            sonido.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            sonido.osc.stop(t + 0.4);
        } catch (e) {}

        sonidosActivos.delete(elemento);
        elemento.classList.remove('activo-sonoro');

        return;
    }

    // crear nuevo
    const sonido = crearSonido(tipo, elemento);

    sonidosActivos.set(elemento, sonido);
    elemento.classList.add('activo-sonoro');

    // =========================
    // MICELIO VIVO (drift global)
    function cicloMicelio() {

        if (!sonidosActivos.has(elemento)) return;

        const now = audioCtx.currentTime;

        // micro-variación de frecuencia
        const drift = (Math.random() - 0.5) * 25;

        sonido.osc.frequency.linearRampToValueAtTime(
            sonido.baseFreq + drift,
            now + 0.8
        );

        // respiración del volumen
        sonido.gainNode.gain.cancelScheduledValues(now);
        sonido.gainNode.gain.setValueAtTime(0.0001, now);
        sonido.gainNode.gain.exponentialRampToValueAtTime(
            sonido.volumen,
            now + 0.3
        );

        sonido.gainNode.gain.exponentialRampToValueAtTime(
            sonido.volumen * 0.5,
            now + 2
        );

        setTimeout(cicloMicelio, 1200 + Math.random() * 2000);
    }

    cicloMicelio();
}


// =========================
// BOTÓN RITUAL
// =========================
btn.addEventListener('click', async () => {

    if (!audioCtx) initAudio();
    if (audioCtx.state !== 'running') await audioCtx.resume();

    sistemaActivo = !sistemaActivo;

    btn.textContent = sistemaActivo
        ? "Desactivar Conjuro"
        : "Inicializar Conjuro Sonoro";

    btn.classList.toggle('activo', sistemaActivo);

    // apagar todo si se desactiva
    if (!sistemaActivo) {

        sonidosActivos.forEach((sonido, elemento) => {

            try {
                sonido.gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
                sonido.osc.stop(audioCtx.currentTime + 0.4);
            } catch (e) {}

            elemento.classList.remove('activo-sonoro');
        });

        sonidosActivos.clear();
    }
});


// =========================
// CLICK EN VERSOS
// =========================
versos.forEach(v => {
    v.addEventListener('click', () => {
        if (!sistemaActivo || !audioCtx) return;
        toggleSonido(v);
    });
});

const invocaciones =
    document.querySelectorAll('.palabra-invocacion');

invocaciones.forEach(palabra => {

    palabra.addEventListener('click', e => {

        const img = document.createElement('img');

        img.src = palabra.dataset.img;

        img.classList.add('imagen-invocada');

        img.style.left =
            `${e.clientX - 120}px`;

        img.style.top =
            `${e.clientY - 140}px`;

        document.body.appendChild(img);

        setTimeout(() => {
            img.remove();
        }, 4000);

    });

});
