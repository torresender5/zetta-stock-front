import LegalLayout from './LegalLayout'
import { LEGAL_UPDATED_AT, OPERADOR } from './legalConfig'

export default function AvisoLegal() {
  return (
    <LegalLayout
      title="Aviso Legal"
      subtitle="Información general del titular del sitio web y condiciones de uso."
    >
      <h2>1. Titular del sitio</h2>
      <ul>
        <li><strong>Denominación:</strong> {OPERADOR.razonSocial}</li>
        <li><strong>RIF:</strong> {OPERADOR.rif}</li>
        <li><strong>Domicilio:</strong> {OPERADOR.domicilio}</li>
        <li><strong>Dominios:</strong> zettastock.com (corporativo) y app.zettastock.com (aplicación)</li>
        <li>
          <strong>Contacto:</strong>{' '}
          <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a>
        </li>
        <li>
          <strong>Protección de datos:</strong>{' '}
          <a href={`mailto:${OPERADOR.emailPrivacidad}`}>{OPERADOR.emailPrivacidad}</a>
        </li>
      </ul>

      <h2>2. Condiciones de uso del sitio</h2>
      <p>
        El acceso al sitio atribuye la condición de usuario e implica la aceptación de este Aviso
        Legal y de los <a href="/terminos">Términos y Condiciones</a>. El usuario se compromete a
        hacer un uso diligente y lícito del sitio y de sus contenidos.
      </p>

      <h2>3. Propiedad intelectual</h2>
      <p>
        Los contenidos del sitio (textos, diseño, código, logotipos, marcas y gráficos) son
        propiedad de {OPERADOR.razonSocial} o de sus licenciantes y están protegidos por la
        legislación de propiedad intelectual aplicable. No se permite su reproducción, distribución
        o transformación sin autorización escrita, salvo los límites legalmente permitidos.
      </p>

      <h2>4. Responsabilidad sobre los contenidos</h2>
      <p>
        Procuramos que la información publicada sea exacta y esté actualizada; no obstante, no
        garantizamos la ausencia de errores tipográficos. Las decisiones tomadas en base a la
        información del sitio son de responsabilidad del usuario. ZettaStock no presta asesoría
        contable, fiscal ni jurídica.
      </p>

      <h2>5. Enlaces a terceros</h2>
      <p>
        El sitio puede enlazar a páginas externas (procesadores de pago, redes sociales, etc.).
        ZettaStock no controla sus contenidos ni sus políticas y no asume responsabilidad por ellos.
      </p>

      <h2>6. Protección de datos</h2>
      <p>
        El tratamiento de datos personales se rige por la{' '}
        <a href="/privacidad">Política de Privacidad</a>, elaborada conforme a la Ley Orgánica de
        Protección de Datos Personales.
      </p>

      <h2>7. Ley aplicable</h2>
      <p>
        Este Aviso Legal se rige por la legislación de la República Bolivariana de Venezuela. Cualquier
        controversia se someterá a los tribunales competentes conforme a los Términos y
        Condiciones.
      </p>

      <h2>8. Actualizaciones</h2>
      <p>
        Última actualización: {LEGAL_UPDATED_AT}. Podemos modificar este aviso; la versión vigente
        es la publicada en esta página.
      </p>
    </LegalLayout>
  )
}
