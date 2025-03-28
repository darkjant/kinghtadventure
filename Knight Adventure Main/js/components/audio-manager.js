/**
 * Gestor de audio del juego
 * Maneja la música de fondo y efectos de sonido
 */

import { audioState } from '../core/game-config.js';

export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.bgMusic = null;
    }

    /**
     * Configura todos los elementos de audio
     */
    create() {
        // Crear objetos de sonido para efectos
        this.sounds = {
            move: this.scene.sound.add('move-self'),      // Movimiento del caballo
            capture: this.scene.sound.add('capture'),     // Captura de peón
            spawn: this.scene.sound.add('pawnSpawn'),     // Aparición de peón
            pawnMove: this.scene.sound.add('PawnMove'),   // Movimiento de peón
            lose: this.scene.sound.add('game-lose-long'), // Fin de juego
            levelUp: this.scene.sound.add('levelUp'),     // Subida de nivel
            illegal: this.scene.sound.add('illegal'),     // Movimiento inválido
            start: this.scene.sound.add('game-start')     // Inicio de juego
        };
        
        // Configurar música de fondo
        this.setupBackgroundMusic();
        
        // Reproducir sonido de inicio
        this.playSound('start');
        
        return this;
    }

    /**
     * Configura la música de fondo
     */
    setupBackgroundMusic() {
        // Seleccionar música aleatoria
        const musicOptions = [
            'bgMusic1', 'bgMusic2', 'bgMusic3',
            'bgMusic4', 'bgMusic5', 'bgMusic6'
        ];
        const randomTrack = Phaser.Math.RND.pick(musicOptions);
        
        // Crear instancia de música con loop
        this.bgMusic = this.scene.sound.add(randomTrack, {
            loop: true,
            volume: 0.3
        });
        
        // Guardar referencia global
        audioState.bgMusicInstance = this.bgMusic;
        console.log('🎵 Nueva música cargada:', this.bgMusic.key);
        
        // Iniciar música si está activada
        this.playMusic();
    }

    /**
     * Reproduce un efecto de sonido si los efectos están activados
     */
    playSound(key) {
        if (audioState.sfxOn && this.sounds[key]) {
            this.sounds[key].play();
        }
    }

    /**
     * Controla la reproducción de la música de fondo
     */
    playMusic() {
        if (audioState.musicOn && this.bgMusic && !this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
    }

    /**
     * Pausa la música de fondo
     */
    pauseMusic() {
        if (this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        }
    }

    /**
     * Reanuda la música de fondo
     */
    resumeMusic() {
        if (audioState.musicOn && this.bgMusic && this.bgMusic.isPaused) {
            this.bgMusic.resume();
        }
    }

    /**
     * Detiene la música de fondo
     */
    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
    }
}