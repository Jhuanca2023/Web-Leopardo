/**
 * CONFIGURACIÓN DE EMAILJS
 * 
 * Para configurar EmailJS:
 * 1. Ve a https://www.emailjs.com/ y crea una cuenta
 * 2. Crea un nuevo servicio de email (Gmail, Outlook, etc.)  
 * 3. Crea una plantilla de email (usa la plantilla de INSTRUCCIONES_EMAILJS.md)
 * 4. Obtén tu Public Key, Service ID y Template ID
 * 5. Reemplaza los valores YOUR_*_HERE con tus datos reales
 * 
 * Lee las instrucciones completas en: INSTRUCCIONES_EMAILJS.md
 */

// Configuración de EmailJS
window.EmailConfig = {
    // Tu Public Key de EmailJS (lo obtienes en Account > API Keys)
    publicKey: "snp7w6sTn-JGDxQaG",
    
    // Service ID (lo obtienes en Email Services)
    serviceId: "service_ys5vchl",
    
    // Template ID (lo obtienes en Email Templates)  
    templateId: "template_yc7xcw1",
    
    // Email de destino (opcional, también se puede definir en la plantilla)
    destinationEmail: "contacto@calzadoindustrialleopardo.com"
};

// Función de validación para verificar que la configuración está completa
window.validateEmailConfig = function() {
    const config = window.EmailConfig;
    
    if (!config) {
        console.error('❌ EmailConfig no encontrado');
        return false;
    }
    
    const requiredFields = ['publicKey', 'serviceId', 'templateId'];
    const missingFields = requiredFields.filter(field => 
        !config[field] || config[field].includes('YOUR_') || config[field].includes('HERE')
    );
    
    if (missingFields.length > 0) {
        console.error('❌ Campos de configuración de EmailJS incompletos:', missingFields);
        console.log('📖 Para configurar EmailJS, lee las instrucciones en INSTRUCCIONES_EMAILJS.md');
        console.log('🔧 O usa el archivo email-config.example.js como base');
        return false;
    }
    
    console.log('✅ Configuración de EmailJS completa y lista para usar');
    return true;
};

// Auto-validar la configuración al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.validateEmailConfig) {
            window.validateEmailConfig();
        }
    }, 1000);
});

// PLANTILLA HTML PERSONALIZADA PARA LEOPARDO - EmailJS Template:
/*
🦎 TEMPLATE LEOPARDO - Copia este código HTML en tu EmailJS Template:

<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #ffffff; padding: 20px; background: radial-gradient(circle at 20% 80%, rgba(245, 197, 24, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245, 197, 24, 0.1) 0%, transparent 50%), #1a1a1a;">
<div style="max-width: 600px; margin: auto; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); overflow: hidden; border: 2px solid #f5c518;">

<!-- Encabezado Leopardo -->
<div style="background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%); color: #000000; padding: 24px; text-align: center; position: relative;">
    <div style="font-size: 48px; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🦎</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">CALZADO INDUSTRIAL LEOPARDO</h1>
    <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Nuevo Mensaje de Contacto Recibido</p>
    <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #000000, #f5c518, #000000);"></div>
</div>

<div style="padding: 30px; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);">
    <h2 style="color: #f5c518; margin-bottom: 16px; font-weight: 700; text-shadow: 0 0 10px rgba(245, 197, 24, 0.3);">¡Tienes un nuevo mensaje!</h2>
    <p style="color: #b3b3b3; margin-bottom: 24px; line-height: 1.6;">Se ha recibido un nuevo mensaje de contacto a través del sitio web de <strong style="color: #f5c518;">Calzado Industrial Leopardo</strong>. Por favor, responde a la brevedad posible.</p>
    
    <!-- Información del contacto -->
    <div style="background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%); border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #f5c518; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <table style="width: 100%; border-collapse: collapse;">
            <tbody>
                <tr>
                    <td style="padding: 12px 8px; border-bottom: 1px solid #404040;"><strong style="color: #f5c518; font-weight: 700;">Nombre:</strong></td>
                    <td style="padding: 12px 8px; color: #ffffff; font-weight: 600; border-bottom: 1px solid #404040;">{{from_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 8px; border-bottom: 1px solid #404040;"><strong style="color: #f5c518; font-weight: 700;">Email:</strong></td>
                    <td style="padding: 12px 8px; border-bottom: 1px solid #404040;"><a href="mailto:{{from_email}}" style="color: #f5c518; text-decoration: none; font-weight: 600;">{{from_email}}</a></td>
                </tr>
                <tr>
                    <td style="padding: 12px 8px; border-bottom: 1px solid #404040;"><strong style="color: #f5c518; font-weight: 700;">Asunto:</strong></td>
                    <td style="padding: 12px 8px; color: #ffffff; font-weight: 600; border-bottom: 1px solid #404040;">{{subject}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 8px;"><strong style="color: #f5c518; font-weight: 700;">Fecha:</strong></td>
                    <td style="padding: 12px 8px; color: #b3b3b3; font-weight: 500;">{{current_date}}</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <!-- Mensaje -->
    <div style="background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f5c518; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <h3 style="color: #f5c518; margin-bottom: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(245, 197, 24, 0.4);">💬 Mensaje:</h3>
        <div style="background: #000000; padding: 20px; border-radius: 8px; border: 1px solid #404040;">
            <p style="color: #ffffff; line-height: 1.8; white-space: pre-line; margin: 0; font-size: 15px;">{{message}}</p>
        </div>
    </div>
    
    <!-- Información del sitio web -->
    <div style="background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%); color: #000000; padding: 20px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 12px rgba(245, 197, 24, 0.3);">
        <h4 style="margin-bottom: 12px; font-weight: 700;">🌐 Información del Sitio Web:</h4>
        <p style="margin: 8px 0; font-weight: 600;"><strong>Sitio web:</strong> <a href="{{website}}" style="color: #000000; text-decoration: none; font-weight: 700;">{{website}}</a></p>
        <p style="margin: 8px 0; font-weight: 600;"><strong>Responder a:</strong> <a href="mailto:{{reply_to}}" style="color: #000000; text-decoration: none; font-weight: 700;">{{reply_to}}</a></p>
    </div>
    
    <!-- Botón de respuesta -->
    <div style="text-align: center; margin: 32px 0;">
        <a href="mailto:{{reply_to}}?subject=Re: {{subject}}" 
           style="display: inline-block; background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%); color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 197, 24, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
           📧 RESPONDER MENSAJE
        </a>
    </div>
</div>

<!-- Footer Leopardo -->
<div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #b3b3b3; padding: 24px; text-align: center; border-top: 2px solid #f5c518;">
    <div style="margin-bottom: 12px;">
        <h3 style="color: #f5c518; margin: 0; font-weight: 700; text-shadow: 0 0 10px rgba(245, 197, 24, 0.3);">🦎 CALZADO INDUSTRIAL LEOPARDO</h3>
    </div>
    <p style="margin: 8px 0; font-weight: 600; color: #f5c518;">Protección y Calidad en Calzado de Seguridad Industrial</p>
    <p style="margin: 8px 0; font-size: 13px; color: #808080;">Este mensaje fue enviado desde el formulario de contacto de <a href="{{website}}" style="color: #f5c518; text-decoration: none; font-weight: 600;">nuestro sitio web</a></p>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #404040;">
        <p style="margin: 0; font-size: 12px; color: #808080;">© 2024 Corporación G & S Leopardo S.A.C. - Todos los derechos reservados</p>
    </div>
</div>

</div>
</div>

🎨 VARIABLES DISPONIBLES EN LA PLANTILLA:
- {{from_name}} - Nombre del remitente
- {{from_email}} - Email del remitente  
- {{to_email}} - Email de destino
- {{subject}} - Asunto del mensaje
- {{message}} - Contenido del mensaje
- {{reply_to}} - Email para responder
- {{reply_to_name}} - Nombre del remitente para Gmail (CALZADO CONTACT)
- {{company_name}} - Nombre de la empresa  
- {{current_date}} - Fecha y hora actual
- {{website}} - URL del sitio web

🔧 INSTRUCCIONES DE USO:
1. Copia TODO el código HTML de arriba (desde <div style="font-family..." hasta </div></div>)
2. Ve a tu cuenta de EmailJS > Email Templates
3. Edita tu plantilla existente (template_yc7xcw1)  
4. Reemplaza el contenido HTML con este código
5. Guarda los cambios

✨ CARACTERÍSTICAS DEL TEMPLATE LEOPARDO:
- Diseño responsive y profesional
- Colores corporativos dorados y negros  
- Logo de leopardo prominente 🦎
- Gradientes elegantes
- Información organizada en tablas
- Botón de respuesta destacado
- Footer con información corporativa
- Compatible con modo oscuro de email
*/