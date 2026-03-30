const formatSessionType = (value) => (value === 'online' ? 'Online' : 'In-person');

const formatStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) return 'Upcoming';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const appointmentModifiedEmail = ({
  client,
  appointment,
  previousType,
  previousStatus,
}) => {
  const hasTypeChanged = previousType && previousType !== appointment.type;
  const hasStatusChanged = previousStatus && previousStatus !== appointment.status;

  const updateItems = [
    hasStatusChanged ? `<li style="margin-bottom: 8px;">Status changed from <strong>${formatStatus(previousStatus)}</strong> to <strong>${formatStatus(appointment.status)}</strong>.</li>` : '',
    hasTypeChanged ? `<li style="margin-bottom: 8px;">Session type changed from <strong>${formatSessionType(previousType)}</strong> to <strong>${formatSessionType(appointment.type)}</strong>.</li>` : '',
  ].filter(Boolean).join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 32px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #4d7f6f 0%, #2f5f56 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">TherapEase</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 32px 40px;">
                  <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Appointment Updated</h2>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Hello ${client.firstName || 'there'},
                  </p>
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Your appointment details have been modified. Please review the latest information below.
                  </p>

                  ${updateItems ? `
                  <ul style="margin: 0 0 24px 20px; padding: 0; color: #374151; font-size: 15px; line-height: 1.6;">
                    ${updateItems}
                  </ul>
                  ` : ''}

                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Date</p>
                        <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">${new Date(appointment.date).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Time</p>
                        <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">${appointment.startTime} - ${appointment.endTime}</p>

                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Type</p>
                        <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">${formatSessionType(appointment.type)}</p>

                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Status</p>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${formatStatus(appointment.status)}</p>
                      </td>
                    </tr>
                  </table>

                  ${appointment.type === 'online' && appointment.zoomLink && appointment.status !== 'cancelled' ? `
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ecfeff; border: 1px solid #bae6fd; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 15px; font-weight: 600;">Updated online session link</p>
                        <a href="${appointment.zoomLink}" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 18px; border-radius: 6px;">Join Session</a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
                    If you have any questions, please contact your therapist.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};