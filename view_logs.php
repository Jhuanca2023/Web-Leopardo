<?php
/**
 * Visor de Logs - Para revisar errores y eventos
 */

// Solo permitir acceso si estás logueado como admin
session_start();
if (!isset($_SESSION['es_admin']) || !$_SESSION['es_admin']) {
    die('Acceso denegado');
}

$errorLogFile = __DIR__ . '/error_log.txt';
$appLogFile = __DIR__ . '/app_log.txt';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visor de Logs - Leopardo</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #1e1e1e; color: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .log-section { background: #2d2d2d; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .log-content { background: #000; padding: 15px; border-radius: 3px; white-space: pre-wrap; font-size: 12px; max-height: 400px; overflow-y: auto; }
        .error { color: #ff6b6b; }
        .info { color: #4ecdc4; }
        .timestamp { color: #95a5a6; }
        .clear-btn { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 3px; cursor: pointer; margin: 10px 5px 0 0; }
        .clear-btn:hover { background: #c0392b; }
        .refresh-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 3px; cursor: pointer; margin: 10px 5px 0 0; }
        .refresh-btn:hover { background: #2980b9; }
        .back-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 3px; cursor: pointer; margin: 10px 5px 0 0; }
        .back-btn:hover { background: #229954; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Visor de Logs - Leopardo</h1>
        
        <div style="margin-bottom: 20px;">
            <button class="refresh-btn" onclick="location.reload()">🔄 Refrescar</button>
            <button class="back-btn" onclick="history.back()">⬅️ Volver</button>
            
            <?php if (isset($_GET['clear']) && $_GET['clear'] === 'errors'): ?>
                <?php file_put_contents($errorLogFile, ''); ?>
                <p style="color: #27ae60;">✅ Log de errores limpiado</p>
            <?php endif; ?>
            
            <?php if (isset($_GET['clear']) && $_GET['clear'] === 'app'): ?>
                <?php file_put_contents($appLogFile, ''); ?>
                <p style="color: #27ae60;">✅ Log de aplicación limpiado</p>
            <?php endif; ?>
        </div>

        <!-- LOG DE ERRORES -->
        <div class="log-section">
            <h2>🚨 Log de Errores</h2>
            <button class="clear-btn" onclick="if(confirm('¿Limpiar log de errores?')) location.href='?clear=errors'">🗑️ Limpiar</button>
            
            <div class="log-content error">
<?php
if (file_exists($errorLogFile)) {
    $errorContent = file_get_contents($errorLogFile);
    if (empty($errorContent)) {
        echo "No hay errores registrados.\n";
    } else {
        // Mostrar las últimas 50 líneas
        $lines = explode("\n", $errorContent);
        $lastLines = array_slice($lines, -50);
        echo htmlspecialchars(implode("\n", $lastLines));
    }
} else {
    echo "Archivo de log de errores no existe aún.\n";
}
?>
            </div>
        </div>

        <!-- LOG DE APLICACIÓN -->
        <div class="log-section">
            <h2>📝 Log de Aplicación</h2>
            <button class="clear-btn" onclick="if(confirm('¿Limpiar log de aplicación?')) location.href='?clear=app'">🗑️ Limpiar</button>
            
            <div class="log-content info">
<?php
if (file_exists($appLogFile)) {
    $appContent = file_get_contents($appLogFile);
    if (empty($appContent)) {
        echo "No hay eventos registrados.\n";
    } else {
        // Mostrar las últimas 50 líneas
        $lines = explode("\n", $appContent);
        $lastLines = array_slice($lines, -50);
        echo htmlspecialchars(implode("\n", $lastLines));
    }
} else {
    echo "Archivo de log de aplicación no existe aún.\n";
}
?>
            </div>
        </div>

        <!-- INFORMACIÓN DEL SISTEMA -->
        <div class="log-section">
            <h2>ℹ️ Información del Sistema</h2>
            <div class="log-content">
Fecha actual: <?php echo date('Y-m-d H:i:s'); ?>

PHP Version: <?php echo phpversion(); ?>

Memoria usada: <?php echo round(memory_get_usage() / 1024 / 1024, 2); ?> MB
Memoria límite: <?php echo ini_get('memory_limit'); ?>

Archivos de log:
- Errores: <?php echo file_exists($errorLogFile) ? 'Existe (' . round(filesize($errorLogFile) / 1024, 2) . ' KB)' : 'No existe'; ?>

- Aplicación: <?php echo file_exists($appLogFile) ? 'Existe (' . round(filesize($appLogFile) / 1024, 2) . ' KB)' : 'No existe'; ?>

            </div>
        </div>
    </div>

    <script>
        // Auto-refresh cada 30 segundos
        setTimeout(function() {
            location.reload();
        }, 30000);
    </script>
</body>
</html>