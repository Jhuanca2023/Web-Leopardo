/**
 * LEOPARDO E-COMMERCE - MANEJO DE ERRORES
 * Sistema centralizado para el manejo de errores
 */

class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Manejar errores de JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Manejar promesas rechazadas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejected',
                error: event.reason
            });
        });

        // Interceptar errores de AJAX
        this.setupAjaxErrorHandling();
    }

    setupAjaxErrorHandling() {
        // Guardar la función original de jQuery.ajax
        const originalAjax = $.ajax;
        
        // Interceptar todas las llamadas AJAX
        $.ajax = function(options) {
            return originalAjax.call(this, options)
                .fail(function(xhr, status, error) {
                    ErrorHandler.handleAjaxError(xhr, status, error, options);
                });
        };
    }

    static handleAjaxError(xhr, status, error, options) {
        const errorInfo = {
            type: 'ajax',
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            url: options.url,
            method: options.type || 'GET',
            error: error
        };

        // Determinar el tipo de error y mostrar mensaje apropiado
        let userMessage = 'Ha ocurrido un error inesperado';
        let errorType = 'error';

        switch (xhr.status) {
            case 400:
                userMessage = 'Solicitud inválida. Por favor, verifica los datos ingresados.';
                break;
            case 401:
                userMessage = 'No tienes autorización para realizar esta acción.';
                // Redirigir al login si no está autenticado
                if (window.Auth && !window.Auth.isAuthenticated()) {
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
                break;
            case 403:
                userMessage = 'No tienes permisos para realizar esta acción.';
                break;
            case 404:
                userMessage = 'El recurso solicitado no fue encontrado.';
                break;
            case 422:
                userMessage = 'Los datos proporcionados no son válidos.';
                errorType = 'warning';
                break;
            case 429:
                userMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
                errorType = 'warning';
                break;
            case 500:
                userMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
                break;
            case 502:
            case 503:
            case 504:
                userMessage = 'El servidor no está disponible temporalmente. Por favor, intenta más tarde.';
                break;
            default:
                if (status === 'timeout') {
                    userMessage = 'La solicitud ha tardado demasiado. Por favor, verifica tu conexión.';
                } else if (status === 'abort') {
                    userMessage = 'La solicitud fue cancelada.';
                } else if (status === 'parsererror') {
                    userMessage = 'Error al procesar la respuesta del servidor.';
                }
        }

        // Mostrar notificación al usuario
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(userMessage, errorType);
        } else if (window.ToastNotification) {
            window.ToastNotification.show(userMessage, errorType);
        }

        // Log del error para debugging
        console.error('AJAX Error:', errorInfo);

        // Enviar error al servidor para logging (opcional)
        ErrorHandler.logErrorToServer(errorInfo);
    }

    handleError(errorInfo) {
        // Log del error
        console.error('Application Error:', errorInfo);

        // Mostrar mensaje al usuario si es crítico
        if (this.isCriticalError(errorInfo)) {
            this.showCriticalErrorModal();
        }

        // Enviar error al servidor para logging
        ErrorHandler.logErrorToServer(errorInfo);
    }

    isCriticalError(errorInfo) {
        // Determinar si el error es crítico y requiere atención del usuario
        return errorInfo.type === 'javascript' && 
               errorInfo.message.includes('Cannot read property') ||
               errorInfo.type === 'promise' && 
               errorInfo.message.includes('Network Error');
    }

    showCriticalErrorModal() {
        const modalHtml = `
            <div class="modal fade" id="criticalErrorModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Error Crítico
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p>Ha ocurrido un error crítico en la aplicación. Por favor:</p>
                            <ul>
                                <li>Recarga la página</li>
                                <li>Verifica tu conexión a internet</li>
                                <li>Si el problema persiste, contacta al soporte técnico</li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-refresh me-2"></i>
                                Recargar Página
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="window.location.href='/'">
                                <i class="fas fa-home me-2"></i>
                                Ir al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('criticalErrorModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('criticalErrorModal'));
        modal.show();
    }

    static async logErrorToServer(errorInfo) {
        try {
            // Solo enviar errores críticos al servidor para evitar spam
            if (this.shouldLogToServer(errorInfo)) {
                // Usar la configuración de API del proyecto
                const apiUrl = window.APP_CONFIG?.apiBaseUrl || window.location.origin + '/api';
                await fetch(apiUrl + '/errors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        error: errorInfo,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        userId: window.AppState?.user?.id || null
                    })
                });
            }
        } catch (logError) {
            // No hacer nada si falla el logging, para evitar loops infinitos
            console.warn('Failed to log error to server:', logError);
        }
    }

    static shouldLogToServer(errorInfo) {
        // Solo logear errores críticos o de servidor
        return errorInfo.type === 'javascript' || 
               errorInfo.type === 'ajax' && errorInfo.status >= 500;
    }

    // Métodos de utilidad para manejo de errores específicos
    static handleValidationError(errors) {
        let errorMessage = 'Por favor, corrige los siguientes errores:\n';
        
        if (typeof errors === 'object') {
            Object.keys(errors).forEach(field => {
                errorMessage += `• ${field}: ${errors[field]}\n`;
            });
        } else {
            errorMessage = errors;
        }

        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(errorMessage, 'warning', 8000);
        }
    }

    static handleNetworkError() {
        const message = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        }
    }

    static handleAuthError() {
        const message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'warning');
        }

        // Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }

    static handlePermissionError() {
        const message = 'No tienes permisos para realizar esta acción.';
        
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        }
    }

    static handleNotFoundError() {
        const message = 'El recurso solicitado no fue encontrado.';
        
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'warning');
        }
    }

    static handleServerError() {
        const message = 'Error interno del servidor. Por favor, intenta más tarde.';
        
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        }
    }

    // Método para mostrar errores de formulario
    static showFormErrors(formElement, errors) {
        // Limpiar errores anteriores
        formElement.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        formElement.querySelectorAll('.invalid-feedback').forEach(element => {
            element.remove();
        });

        // Mostrar nuevos errores
        Object.keys(errors).forEach(fieldName => {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('is-invalid');
                
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = errors[fieldName];
                
                field.parentNode.appendChild(feedback);
            }
        });
    }

    // Método para limpiar errores de formulario
    static clearFormErrors(formElement) {
        formElement.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        formElement.querySelectorAll('.invalid-feedback').forEach(element => {
            element.remove();
        });
    }
}

// Inicializar el manejador de errores cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
});

// Exportar para uso global
window.ErrorHandler = ErrorHandler;