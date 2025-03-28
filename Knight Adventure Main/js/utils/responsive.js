/**
 * Utilidades para manejo responsive y adaptativo
 */

/**
 * Inicializa el viewport para garantizar compatibilidad en todos los dispositivos
 */
export function initializeResponsiveViewport() {
    // Configurar viewport para evitar el zoom del usuario
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute(
            'content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
    }
    
    // Inyectar CSS para garantizar área de juego correcta
    const style = document.createElement('style');
    style.textContent = `
        #game-container {
            width: 100vw !important;
            height: calc(100vh - 50px) !important; /* Resta altura de barra superior */
            overflow: hidden !important;
            position: absolute !important;
            top: 50px !important;
            left: 0 !important;
        }
        
        canvas {
            display: block !important;
        }
        
        /* Mejor visualización en móviles */
        @media (max-width: 767px) {
            #game-container {
                height: calc(100vh - 50px) !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Forzar scroll inicial para ocultar barra de navegación
    setTimeout(() => window.scrollTo(0, 1), 100);
    
    // Marcar como inicializado
    window.viewportInitialized = true;
}

/**
 * Determina si el dispositivo es iOS
 */
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Determina si el dispositivo es una tableta
 */
export function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1024;
}

/**
 * Calcula el tamaño de fuente adaptativo basado en el tamaño de casilla
 */
export function calculateAdaptiveFontSize(tileSize) {
    const baseFontSize = tileSize * 0.4;
    const minFontSize = 10; // Mínimo para legibilidad
    const maxFontSize = 24; // Máximo para buena apariencia
    
    return Math.min(Math.max(baseFontSize, minFontSize), maxFontSize) + 'px';
}