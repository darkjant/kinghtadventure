/**
 * Gestión de puntuaciones
 * Maneja el guardado y carga de puntuaciones con Firebase
 */

/**
 * Guarda la puntuación en Firestore
 */
export function saveHighScore(score) {
    // Obtener referencias a Firebase desde window
    const auth = window.auth;
    const db = window.db;
    const addDoc = window.addDoc;
    const collection = window.collection;

    // Verificar si hay usuario autenticado
    if (!auth.currentUser) {
        console.log("⚠️ Usuario no autenticado, no se guardará el puntaje.");
        return;
    }

    // Calcular tiempo de juego
    const elapsedTime = (window.performance.now() - window.gameInstance.scene.scenes[0].startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const tenths = Math.floor((elapsedTime * 10) % 10);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;

    // Guardar en Firestore
    addDoc(collection(db, "highscores"), {
        email: auth.currentUser.email,
        score: score,
        timeTaken: formattedTime,
        timestamp: new Date()
    })
    .then(() => {
        console.log("✅ Puntaje guardado en Firestore");
        
        // Actualizar leaderboard si existe la función
        if (typeof window.loadLeaderboard === 'function') {
            window.loadLeaderboard(10);
        }
    })
    .catch((error) => {
        console.error("❌ Error guardando el puntaje:", error);
    });
}