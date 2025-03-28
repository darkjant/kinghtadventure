/**
 * Configuración principal del juego
 * Contiene la configuración de Phaser y ajustes globales
 */

// Estado global de audio
export const audioState = {
    musicOn: true,        // Estado de la música de fondo
    sfxOn: true,          // Estado de los efectos de sonido
    bgMusicInstance: null // Referencia global a la instancia de música
};

// Configuración del juego por nivel
export const levelConfig = {
    // Nivel: [pawnSpawnRate, pawnMoveDelay, maxPawns]
    1: [3000, 3000, 2],
    2: [3000, 3000, 3],
    3: [2500, 3000, 3],
    4: [2500, 3000, 4],
    5: [2500, 2500, 4],
    6: [2000, 2500, 4],
    7: [2000, 2500, 5],
    8: [2000, 2000, 5],
    9: [1500, 2000, 5],
    10: [1500, 2000, 6]
};

// Umbrales de puntuación para subir de nivel
export const levelThresholds = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27];

// Configuración del juego Phaser
export const config = {
    type: Phaser.AUTO,
    backgroundColor: '#555',
    parent: 'game-container',
    scene: [], // Se cargarán dinámicamente en bootstrap.js
    // Sistema de escalado adaptativo
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    // Optimizaciones de renderizado
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true
    }
};