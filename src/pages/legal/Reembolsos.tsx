import LegalLayout from './LegalLayout'
import { OPERADOR } from './legalConfig'

export default function Reembolsos() {
  return (
    <LegalLayout
      title="Política de Reembolsos y Cancelación"
      subtitle="Condiciones de cobro, renovación, cancelación y reembolso de los planes pagos de ZettaStock."
    >
      <h2>1. Prueba gratuita</h2>
      <p>
        Toda cuenta nueva dispone de una prueba gratuita         (treinta (30) días, salvo indicación
        distinta al momento del registro). Durante la prueba no se cobra nada y no se solicita
        tarjeta de crédito. Al finalizar, la cuenta pasa al plan gratuito si no contratas un plan
        de pago.
      </p>

      <h2>2. Forma de cobro</h2>
      <ul>
        <li>
          Los planes de pago se contratan por un período elegido (mensual o anual) y se pagan
          <strong> por adelantado</strong> mediante Stripe, Pabilo o transferencia manual.
        </li>
        <li>
          <strong>No hay renovación automática con cargo recurrente:</strong> al vencer tu
          período, enviamos recordatorios por correo antes de la fecha de expiración. Solo se
          genera un nuevo cargo si tú decides contratar otro período.
        </li>
        <li>Los precios vigentes se muestran antes de confirmar el pago.</li>
      </ul>

      <h2>3. Derecho de retracto y reembolsos</h2>
      <p>
        Puedes solicitar un reembolso escribiendo a{' '}
        <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a> dentro de los{' '}
        <strong>catorce (14) días</strong> contados desde el pago, siempre que:
      </p>
      <ul>
        <li>no hayas consumido sustancialmente el período contratado (uso limitado a prueba); o</li>
        <li>haya existido una falla del Servicio atribuible a ZettaStock que no haya podido corregirse en tiempo razonable.</li>
      </ul>
      <p>
        Transcurrido ese plazo o agotado el período, los pagos no son reembolsables salvo obligación
        legal. Los reembolsos se devuelven por el mismo medio de pago utilizado, dentro de diez (10)
        días hábiles desde su aprobación; los plazos finales del proveedor de pago aplican según su
        política.
      </p>

      <h2>4. Cancelación</h2>
      <p>
        Puedes cancelar la renovación de tu plan en cualquier momento: basta con no renovar, o
        solicitarlo a {OPERADOR.emailSoporte}. La cancelación impide cargos futuros; el servicio
        permanece activo hasta la fecha de vencimiento ya pagada, sin reembolso proporcional salvo
        lo indicado en la sección 3.
      </p>

      <h2>5. Fallos de pago y cuentas impagas</h2>
      <p>
        Si un pago es rechazado o impugnado, la cuenta puede degradarse al plan gratuito o
        suspende tras aviso, manteniendo tus datos disponibles durante un plazo razonable para
        su exportación o eliminación conforme a la{' '}
        <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>6. Errores de precio</h2>
      <p>
        Si detectamos un error de precio en un plan, te informaremos y podrás continuar al precio
        correcto o cancelar sin costo.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Solicitudes de reembolso y cancelación:{' '}
        <a href={`mailto:${OPERADOR.emailSoporte}`}>{OPERADOR.emailSoporte}</a> (indica el correo
        de la cuenta, el plan y el motivo).
      </p>
    </LegalLayout>
  )
}
