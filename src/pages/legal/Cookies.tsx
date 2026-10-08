import LegalLayout from './LegalLayout'
import { LEGAL_UPDATED_AT } from './legalConfig'

export default function Cookies() {
  return (
    <LegalLayout
      title="Política de Cookies y Tecnologías de Almacenamiento"
      subtitle="Información sobre las tecnologías que ZettaStock utiliza en tus dispositivos."
    >
      <h2>1. ¿Usamos cookies?</h2>
      <p>
        ZettaStock <strong>no utiliza cookies de publicidad ni de seguimiento</strong>, ni
        integraciones de analítica o publicidad de terceros (Google Analytics, píxeles de
        redes sociales, etc.). Por ello no mostramos un banner de consentimiento de cookies: no hay
        cookies que aceptar para navegar.
      </p>

      <h2>2. Tecnologías que sí utilizamos</h2>
      <ul>
        <li>
          <strong>Almacenamiento local (localStorage) en la web:</strong> guardamos tu sesión
          (token de autenticación) bajo la clave <code>auth-token</code> para mantenerte conectado.
          No se usa para rastrearte en otros sitios.
        </li>
        <li>
          <strong>Almacenamiento seguro en la app móvil:</strong> el token se guarda en el
          Keychain de iOS y el Keystore de Android, mecanismos cifrados del sistema.
        </li>
        <li>
          <strong>Cookies técnicas estrictamente necesarias:</strong> si tu navegador o el servidor
          de la plataforma genera cookies de sesión o de balanceo de carga estrictamente
          necesarias para operar, su uso se basa en el interés legítimo en proporcionar un
          servicio seguro.
        </li>
      </ul>

      <h2>3. Terceros</h2>
      <p>
        Cuando pagas con Stripe o Pabilo, esos proveedores pueden instalar sus propias cookies o
        tecnologías similares en su página de pago, regidas por sus políticas. Nosotros no los
        controlamos.
      </p>

      <h2>4. Cómo controlar el almacenamiento local</h2>
      <p>
        Puedes borrar el almacenamiento local de tu navegador en cualquier momento (Configuración →
        Privacidad → Datos del sitio). Ten en cuenta que al hacerlo cerrarás tu sesión en la
        aplicación web.
      </p>

      <h2>5. Cambios en esta política</h2>
      <p>
        Si en el futuro incorporamos cookies o tecnologías de seguimiento, actualizaremos esta
        política ({LEGAL_UPDATED_AT} en esta versión) y solicitaremos tu consentimiento previo
        mediante un aviso oportuno.
      </p>
    </LegalLayout>
  )
}
