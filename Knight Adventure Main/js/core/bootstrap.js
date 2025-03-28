/**
 * Inicialización del juego
 * Punto de entrada principal que prepara todo el entorno
 */

import { config } from './game-config.js';
import { MainScene } from '../scenes/main-scene.js';
import { initializeResponsiveViewport } from '../utils/responsive.js';

// Función para iniciar el juego
export function initGame() {
    // Configurar viewport responsive
    initializeResponsiveViewport();
    
    // Añadir escenas a la configuración
    config.scene = [MainScene];
    
    // Crear instancia del juego y guardarla globalmente
    window.gameInstance = new Phaser.Game(config);
    
    // Configurar eventos generales
    setupEventListeners();
    
    return window.gameInstance;
}

// Configurar listeners de eventos globales
function setupEventListeners() {
    // Eventos de redimensionamiento y orientación
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 200);
    });
}

// Manejar cambios de tamaño y orientación
function handleResize() {
    if (!window.gameInstance || !window.gameInstance.scene) return;
    
    const currentOrientation = window.innerHeight > window.innerWidth;
    
    if (typeof window.lastOrientation !== 'undefined' && 
        window.lastOrientation !== currentOrientation) {
        
        const activeScene = window.gameInstance.scene.scenes[0];
        if (activeScene) {
            setTimeout(() => {
                activeScene.scene.restart();
            }, 100);
        }
    }
    
    window.lastOrientation = currentOrientation;
}