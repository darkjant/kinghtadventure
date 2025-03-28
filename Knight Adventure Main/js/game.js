/**
 * KNIGHT VS PAWNS - JUEGO DE AJEDREZ
 * 
 * Archivo principal que inicializa el juego
 * y expone las funciones globales necesarias
 */

import { audioState } from './core/game-config.js';
import { initGame } from './core/bootstrap.js';
import { initializeResponsiveViewport } from './utils/responsive.js';

// IMPORTANTE: Primero definimos la función global, antes que cualquier código
// Definir inmediatamente la función global para que esté disponible
window.showGameScreen = function() {
    console.log("Inicializando juego desde módulo game.js");
    
    // Inicializar viewport responsive si no se ha hecho
    if (!window.viewportInitialized) {
        initializeResponsiveViewport();
    }
    
    // Crear instancia del juego si no existe
    if (!window.gameInstance) {
        window.gameInstance = initGame();
    }
};

// Configurar botones de música y efectos cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar viewport responsive
    initializeResponsiveViewport();
    
    // Configurar botones de audio
    setupAudioControls();
    
    console.log("DOM cargado y viewport inicializado");
});

/**
 * Configura los controles de audio
 */
function setupAudioControls() {
    const musicBtn = document.getElementById('toggleMusic');
    const sfxBtn = document.getElementById('toggleSFX');

    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            // Alternar estado de música
            audioState.musicOn = !audioState.musicOn;

            // Actualizar instancia de música
            if (audioState.bgMusicInstance) {
                if (audioState.musicOn) {
                    if (audioState.bgMusicInstance.isPaused) {
                        audioState.bgMusicInstance.resume();
                    } else if (!audioState.bgMusicInstance.isPlaying) {
                        audioState.bgMusicInstance.play();
                    }
                    musicBtn.innerHTML = '<i class="fas fa-music"></i> Musica';
                } else {
                    if (audioState.bgMusicInstance.isPlaying) {
                        audioState.bgMusicInstance.pause();
                    }
                    musicBtn.innerHTML = '<i class="fas fa-music"></i> Musica';
                }
            }
        });
    }

    if (sfxBtn) {
        sfxBtn.addEventListener('click', () => {
            // Alternar estado de efectos de sonido
            audioState.sfxOn = !audioState.sfxOn;
            
            // Actualizar interfaz
            sfxBtn.innerHTML = audioState.sfxOn 
                ? '<i class="fas fa-volume-up"></i> Efectos' 
                : '<i class="fas fa-volume-mute"></i> Efectos';
        });
    }
}

// Impresión de confirmación de carga
console.log("Módulo game.js cargado correctamente");