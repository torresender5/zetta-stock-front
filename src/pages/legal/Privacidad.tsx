import LegalLayout from './LegalLayout'
import { LEGAL_UPDATED_AT, MIN_EDAD, OPERADOR } from './legalConfig'

export default function Privacidad() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Aviso de privacidad conforme a la Ley Orgánica de Protección de Datos Personales (Venezuela)."
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>{OPERADOR.razonSocial}</strong>, RIF {OPERADOR.rif}, domicilio en{' '}
        {OPERADOR.domicilio}, es responsable del tratamiento de tus datos personales. Contacto de
        privacidad: <a href={`mailto:${OPERADOR.emailPrivacidad}`}>{OPERADOR.emailPrivacidad}</a>.
      </p>

      <h2>2. Datos personales que recopilamos</h2>
      <h3>2.1. Datos del registrante (tú, como usuario de la cuenta)</h3>
      <ul>
        <li>Nombre completo</li>
        <li>Correo electrónico</li>
        <li>Contraseña (almacenada cifrada con hash, nunca en texto plano)</li>
        <li>Documento de identidad (cédula o NIT), cuando lo proporcionas</li>
        <li>Teléfono y dirección, cuando los proporcionas</li>
        <li>Datos de tu empresa: razón social, logotipo y datos de contacto</li>
        <li>Registros técnicos: dirección IP, fecha/hora de acceso y agente de usuario</li>
      </ul>
      <h3>2.2. Datos que el administrador de la cuenta introduce sobre terceros</h3>
      <p>
        En tu calidad de negocio, puedes registrar clientes, proveedores y transacciones. Esos
        datos (nombre, cédula/NIT, teléfono, correo, dirección, compras) son introducidos por ti y
        su tratamiento se rige por tu propia responsabilidad; ZettaStock los trata únicamente para
        prestarte el Servicio.
      </p>

      <h2>3. Finalidades del tratamiento</h2>
      <p>Tratamos tus datos para:</p>
      <ul>
        <li>crear y administrar tu cuenta y verificar tu identidad;</li>
        <li>prestar el Servicio: facturación, inventario, reportes y soporte;</li>
        <li>gestionar suscripciones, cobros y avisos de vencimiento de tu plan;</li>
        <li>garantizar la seguridad del Servicio y prevenir abusos;</li>
        <li>cumplir obligaciones legales y atender requerimientos de autoridades competentes;</li>
        <li>
          comunicaciones operativas (cambios del servicio, mantenimientos, recordatorios de
          suscripción). No enviamos publicidad de terceros; si en el futuro se añadiera, se
          solicitará consentimiento previo y podrás darte de baja.
        </li>
      </ul>

      <h2>4. Base legal del tratamiento</h2>
      <ul>
        <li>
          <strong>Consentimiento expreso:</strong> otorgado al marcar la casilla de aceptación de
          Términos y Privacidad durante el registro, con registro de fecha, versión del documento,
          IP y agente de usuario.
        </li>
        <li>
          <strong>Ejecución del contrato:</strong> los datos necesarios para prestarte el Servicio
          y gestionar tu suscripción.
        </li>
        <li>
          <strong>Interés legítimo:</strong> seguridad, prevención de fraude y mejora del
          Servicio, siempre respetando tus derechos.
        </li>
        <li><strong>Obligación legal:</strong> conservación exigida por normativa fiscal o contable.</li>
      </ul>

      <h2>5. Menores de edad</h2>
      <p>
        El Servicio no está dirigido a menores de edad. El registro exige declarar tener al menos{' '}
        {MIN_EDAD} años. Si detectamos que se ha registrado un menor, daremos de baja su cuenta y
        anonimizaremos sus datos de acceso.
      </p>

      <h2>6. Encargados y transferencias a terceros</h2>
      <p>Compartimos únicamente lo necesario con nuestros proveedores (encargados):</p>
      <ul>
        <li><strong>Cloudflare (R2)</strong> — almacenamiento de logotipos e imágenes.</li>
        <li><strong>Stripe</strong> — procesamiento de pagos con tarjeta.</li>
        <li><strong>Pabilo</strong> — procesamiento de pagos.</li>
        <li><strong>Proveedor de alojamiento</strong> (VPS/servidores) — base de datos y aplicación.</li>
        <li><strong>Proveedor de correo (SMTP)</strong> — envío de correos transaccionales.</li>
      </ul>
      <p>
        No vendemos ni cedemos tus datos personales a terceros con fines comerciales. La lista de
        encargados puede actualizarse; publicaremos cualquier cambio relevante en esta política.
      </p>

      <h2>7. Conservación de los datos</h2>
      <p>
        Conservamos tus datos mientras exista relación contractual y, después, durante los plazos
        exigidos por la legislación fiscal y contable aplicable, o mientras existan reclamaciones
        pendientes. Los registros de consentimiento se conservan durante la vigencia de la cuenta y
        el plazo legal posterior para acreditar el cumplimiento.
      </p>
      <ul>
        <li>
          <strong>Cuenta y perfil:</strong> mientras la cuenta esté activa; tras la baja, se
          anonimizan (ver sección 8) y solo se conserva lo necesario para obligaciones legales.
        </li>
        <li>
          <strong>Prueba de consentimiento:</strong> registros de aceptación con versión, fecha, IP
          y agente de usuario, conservados como prueba durante la vigencia y el plazo legal
          posterior.
        </li>
        <li>
          <strong>Registros operativos (logs de la aplicación):</strong> se conservan por un máximo
          de 30 días, en archivos comprimidos de hasta 5 MB con un máximo de 30 archivos, y se usan
          con finalidad de diagnóstico, seguridad y cumplimiento.
        </li>
        <li>
          <strong>Ventas, facturas y documentos contables:</strong> se conservan por obligación
          legal. Cuando un dato personal deja de ser necesario, se suprime o se <em>anonimiza</em> en
          lugar de eliminarse junto con la transacción: las ventas y facturas mantienen únicamente
          las copias mínimas del cliente (nombre, documento y dirección) exigidas para la validez
          del documento.
        </li>
      </ul>

      <h2>8. Tus derechos (acceso, rectificación, supresión, oposición y revocación)</h2>
      <p>
        Conforme a la Ley Orgánica de Protección de Datos Personales, tienes derecho a conocer qué
        datos tuyos tratamos, a rectificarlos, a solicitar su supresión cuando ya no sean
        necesarios, a oponerte a ciertos tratamientos y a revocar el consentimiento otorgado.
      </p>
      <p>Para ejercerlos, escribe a <a href={`mailto:${OPERADOR.emailPrivacidad}`}>{OPERADOR.emailPrivacidad}</a> indicando:</p>
      <ol>
        <li>tu nombre y correo de la cuenta;</li>
        <li>el derecho que ejerces (acceso, rectificación, supresión, oposición o revocación);</li>
        <li>una descripción de los datos a los que se refiere; y</li>
        <li>copia de tu documento de identidad.</li>
      </ol>
      <p>
        Responderemos dentro de un plazo razonable no mayor a quince (15) días hábiles. Si no
        quedas conforme, puedes reclamar ante la autoridad competente en materia de protección de
        datos personales en Venezuela (SENIAC) u órgano que resulte aplicable.
      </p>
      <p>
        Además del correo, puedes ejercerlos por tu cuenta desde tu sesión de usuario mediante la
        API de la aplicación:
      </p>
      <ul>
        <li>
          <strong>Acceso y exportación:</strong> descarga de tus datos en formato electrónico (
          <code>GET /users/me/export</code>) con tu perfil, tu empresa, tus consentimientos y tus
          solicitudes.
        </li>
        <li>
          <strong>Rectificación, supresión y revocación:</strong> registro de la solicitud (
          <code>POST /data-subject-request</code>) con acuse, estado y fecha límite de respuesta
          (quince (15) días hábiles). La rectificación de tu perfil también puedes hacerla tú
          directamente en la configuración de la cuenta.
        </li>
      </ul>
      <p>
        <strong>Supresión de la cuenta.</strong> La supresión se ejecuta como <em>baja y
        anonimización</em>, no como borrado físico inmediato: la cuenta queda desactivada y sus
        datos de acceso (correo, nombre y contraseña) se sustituyen por valores que no permiten
        identificarte, mientras que los registros de ventas, facturas y demás datos que debemos
        conservar por obligación legal se mantienen o se anonimizan para no alterar los documentos
        contables. Los registros de consentimiento se conservan como prueba del cumplimiento.
      </p>
      <p>
        Para los datos de clientes o proveedores que registras en tu cuenta, el responsable eres
        tú (sección 2.2): sus derechos se ejercen ante quien introdujo sus datos y ZettaStock
        interviene únicamente como encargado del tratamiento.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas: contraseñas cifradas con bcrypt, comunicación
        cifrada (HTTPS), control de acceso por roles, aislamiento de datos entre empresas
        (multi-tenant) y registros de seguridad. Ningún sistema es 100% seguro; si detectamos una
        incidente de seguridad que afecte tus datos, te notificaremos conforme a la ley.
      </p>

      <h2>10. Cookies y almacenamiento local</h2>
      <p>
        No usamos cookies de publicidad ni de seguimiento de terceros. Utilizamos almacenamiento
        local del navegador para mantener tu sesión iniciada. Consulta la{' '}
        <a href="/cookies">Política de Cookies</a> para el detalle.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política; publicaremos la versión vigente con su fecha de
        actualización ({LEGAL_UPDATED_AT} en esta versión). Los cambios sustanciales se notificarán
        por correo o aviso en la aplicación.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Dudas o ejercicio de derechos:{' '}
        <a href={`mailto:${OPERADOR.emailPrivacidad}`}>{OPERADOR.emailPrivacidad}</a> · Soporte:{' '}
        <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a>
      </p>
    </LegalLayout>
  )
}
