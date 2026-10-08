import LegalLayout from './LegalLayout'
import { LEGAL_UPDATED_AT, MIN_EDAD, OPERADOR } from './legalConfig'

export default function Terminos() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Condiciones generales de uso y contratación del servicio ZettaStock."
    >
      <h2>1. Identificación del prestador del servicio</h2>
      <p>
        El servicio ZettaStock (en adelante, «el Servicio») es prestado por{' '}
        <strong>{OPERADOR.razonSocial}</strong>, con RIF {OPERADOR.rif}, con domicilio en{' '}
        {OPERADOR.domicilio} (en adelante, «ZettaStock» o «el Prestador»). Contacto:{' '}
        <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a>.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Estos Términos y Condiciones (en adelante, «los Términos») regulan el acceso y uso de la
        aplicación web y móvil ZettaStock, plataforma de facturación, inventario y gestión
        comercial. El acceso o uso del Servicio implica la aceptación plena y sin reservas de estos
        Términos en la versión publicada en el momento del acceso.
      </p>
      <p>
        Si no estás de acuerdo con alguna disposición, no debes crear una cuenta ni utilizar el
        Servicio.
      </p>

      <h2>3. Requisitos de uso y edad mínima</h2>
      <p>
        Para registrarte y usar el Servicio debes ser mayor de edad ({MIN_EDAD} años o más), tener
        capacidad legal para contratar y ser residente en un país donde el Servicio esté disponible.
        El uso del Servicio por parte de menores de edad queda expresamente prohibido.
      </p>
      <p>
        Si registras una cuenta en representación de una empresa u otra persona jurídica, declaras
        que cuentas con facultades suficientes para obligar a dicha entidad frente a estos Términos.
      </p>

      <h2>4. Registro de cuenta</h2>
      <p>
        El registro requiere información veraz y actualizada (nombre, correo electrónico y, cuando
        corresponda, documento de identidad, teléfono y dirección). Eres responsable de:
      </p>
      <ul>
        <li>mantener la confidencialidad de tus credenciales de acceso;</li>
        <li>toda actividad realizada desde tu cuenta; y</li>
        <li>notificar de inmediato cualquier uso no autorizado a {OPERADOR.emailSoporte}.</li>
      </ul>

      <h2>5. Cuenta multiusuario y responsabilidad del administrador</h2>
      <p>
        La cuenta principal («administrador») puede crear usuarios adicionales con roles
        (vendedor, inventario, etc.). El administrador es responsable de asignar únicamente roles
        adecuados, de supervisar la actividad de sus usuarios y de obtener, cuando resulte
        aplicable, los consentimientos legalmente exigidos respecto de las personas cuyos datos
        introduzca en el Servicio (clientes, proveedores y demás terceros).
      </p>
      <p>
        ZettaStock actúa como prestador de la herramienta y, respecto de esos datos de terceros
        introducidos por el administrador, como encargado del tratamiento conforme a la sección 7 y
        a la Política de Privacidad.
      </p>

      <h2>6. Planes de pago, prueba gratuita y facturación</h2>
      <p>
        El Servicio se ofrece en planes gratuitos y de pago. Las cuentas nuevas disfrutan de un
        período de prueba gratuito según se indique en el momento del registro. Los precios, la
        duración de cada período y las características de cada plan se muestran en la pantalla de
        planes y pueden actualizarse con aviso previo razonable.
      </p>
      <ul>
        <li>Los cargos se realizan mediante los procesadores de pago indicados (Stripe, Pabilo u otros).</li>
        <li>No se almacena información de tarjetas ni credenciales de pago en nuestros servidores.</li>
        <li>
          El detalle sobre reembolsos, cancelación y renovaciones se encuentra en la{' '}
          <a href="/reembolsos">Política de Reembolsos y Cancelación</a>, que forma parte
          integrante de estos Términos.
        </li>
      </ul>

      <h2>7. Datos personales y rol de las partes</h2>
      <p>
        En relación con los datos del administrador y sus usuarios, ZettaStock es responsable del
        tratamiento conforme a la Ley Orgánica de Protección de Datos Personales. En relación con
        los datos que el administrador introduce sobre sus clientes y proveedores, ZettaStock
        interviene como encargado del tratamiento, actuando exclusivamente según las instrucciones
        del administrador.
      </p>
      <p>
        En concreto, los <strong>clientes, proveedores y demás personas cuyos datos se introducen
        en el Servicio son responsabilidad del administrador de la cuenta</strong>: es el
        administrador quien determina las finalidades y bases legales de ese tratamiento, quien debe
        atender las solicitudes de esas personas y quien responde de haber obtenido sus
        consentimientos cuando resulte exigible. ZettaStock no controla esos datos y los trata
        únicamente para prestar el Servicio; las solicitudes de derechos de esas personas deben
        dirigirse primero a quien registró sus datos, y ZettaStock prestará la cooperación que
        legalmente le corresponda en calidad de encargado.
      </p>
      <p>
        El tratamiento de datos personales se rige por la{' '}
        <a href="/privacidad">Política de Privacidad</a>, que forma parte integrante de estos
        Términos.
      </p>

      <h2>8. Obligaciones del usuario</h2>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>utilizar el Servicio conforme a la ley, la buena fe y estos Términos;</li>
        <li>no introducir malware, contenido ilícito ni datos de terceros sin autorización;</li>
        <li>
          no realizar ingeniería inversa, copia, revenda, explotación comercial ni ataques al
          Servicio o a sus servidores;
        </li>
        <li>no usar el Servicio para emitir documentos fiscales fraudulentos o de falsa entrada;</li>
        <li>respetar los derechos de propiedad intelectual de ZettaStock y de terceros.</li>
      </ul>

      <h2>9. Propiedad intelectual</h2>
      <p>
        ZettaStock es titular o licenciatario de los derechos sobre el software, diseño, marca,
        logotipos, documentación y demás elementos del Servicio. Se concede al usuario una licencia
        limitada, no exclusiva, intransferible y revocable para uso del Servicio conforme a estos
        Términos. Los datos ingresados por el usuario le pertenecen al usuario.
      </p>

      <h2>10. Disponibilidad y mantenimiento</h2>
      <p>
        ZettaStock procura alta disponibilidad, pero no garantiza la operación ininterrumpida
        libre de errores. Podemos realizar mantenimientos, cortes o cambios operativos, procurando
        avisar con antelación razonable cuando sean planificados. No respondemos por fallos
        derivados de conexiones a internet del usuario, fuerza mayor o terceros ajenos.
      </p>

      <h2>11. Limitación de responsabilidad</h2>
      <p>
        El Servicio es una herramienta de gestión. Los cálculos de impuestos, reportes y documentos
        generados se basan en la configuración suministrada por el usuario y{' '}
        <strong>no constituyen asesoría contable, fiscal ni jurídica</strong>. El usuario es
        responsable de verificar la exactitud de la información ingresada y del cumplimiento de sus
        obligaciones tributarias.
      </p>
      <p>
        En la máxima medida permitida por la ley aplicable, ZettaStock no será responsable por
        lucro cesante, pérdida de datos debida a configuración del usuario, ni daños indirectos,
        salvo dolo comprobado o los casos que la ley no permita excluir.
      </p>

      <h2>12. Servicios de terceros</h2>
      <p>
        El Servicio se apoya en terceros (alojamiento, almacenamiento de archivos en Cloudflare,
        pagos con Stripe y Pabilo, envío de correos). El uso de esos servicios se rige por sus
        propias condiciones y políticas, recomendadas en la Política de Privacidad. ZettaStock no
        controla sus prácticas y responde de ellas conforme a la ley.
      </p>

      <h2>13. Suspensión y terminación</h2>
      <p>
        Podemos suspender o cerrar cuentas que violen estos Términos, incurran en impago, o cuya
        actividad implique riesgo de seguridad, previo aviso cuando sea posible. El usuario puede
        dejar de usar el Servicio y ejercer la supresión de su cuenta en cualquier momento, desde
        su sesión de usuario (API de la aplicación) o escribiendo a {OPERADOR.emailSoporte} (la
        supresión se ejecuta como baja y anonimización, conforme a la sección 7 y a la{' '}
        <a href="/privacidad">Política de Privacidad</a>). El cierre no exonera de obligaciones
        pendientes de pago.
      </p>

      <h2>14. Modificaciones de los Términos</h2>
      <p>
        Podemos actualizar estos Términos. Publicaremos la versión vigente con su fecha de
        actualización ({LEGAL_UPDATED_AT} en esta versión). Los cambios sustanciales se notificarán
        por correo electrónico o mediante aviso en la aplicación con antelación razonable. El uso
        continuado tras la vigencia implica aceptación.
      </p>

      <h2>15. Ley aplicable y resolución de controversias</h2>
      <p>
        Estos Términos se rigen por la legislación de la República Bolivariana de Venezuela. Las
        partes procurarán resolver cualquier controversia de buena fe primero por las vías de
        contacto del Servicio. De no alcanzarse acuerdo, las partes se someten a los tribunales
        competentes de la jurisdicción correspondiente, con renuncia a cualquier otro fuero.
      </p>

      <h2>16. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos:{' '}
        <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a>.
      </p>
    </LegalLayout>
  )
}
