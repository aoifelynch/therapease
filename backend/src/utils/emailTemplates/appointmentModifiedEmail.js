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
    <title>Therapy Appointment Update</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f7f5f2; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:30px auto; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            <tr>
              <td style="background:#3A6F6F; padding:20px; text-align:center; color:#ffffff;">
                <h2 style="margin:0;">Therapy Appointment Updated</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px; color:#333333;">
                <p style="font-size:16px;">Hello ${client.firstName || 'there'},</p>

                <p style="font-size:16px;">
                  Your appointment details have been modified. Please review the latest information below.
                </p>

                ${updateItems ? `
                <ul style="margin: 0 0 20px 20px; padding: 0; color: #333333; font-size: 15px; line-height: 1.6;">
                  ${updateItems}
                </ul>
                ` : ''}

                <table width="100%" cellpadding="15" cellspacing="0" style="background:#f0ebe5; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td>
                      <p style="margin:5px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p style="margin:5px 0;"><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
                      <p style="margin:5px 0;"><strong>Type:</strong> ${formatSessionType(appointment.type)}</p>
                      <p style="margin:5px 0;"><strong>Status:</strong> ${formatStatus(appointment.status)}</p>
                    </td>
                  </tr>
                </table>

                ${appointment.type === 'online' && appointment.zoomLink && appointment.status !== 'cancelled' ? `
                <table width="100%" cellpadding="15" cellspacing="0" style="background:#f0ebe5; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td>
                      <p style="margin:5px 0;"><strong>Updated online session link:</strong></p>
                      <p style="margin:10px 0 0 0;">
                        <a href="${appointment.zoomLink}" style="color:#3A6F6F; text-decoration:none;">
                          Join Session
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <p style="font-size:14px; color:#555;">
                  If you have any questions, please contact your therapist.
                </p>

                <p style="margin-top:30px;">
                  Kind regards,<br>
                  <strong>The TherapEase Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f7f5f2; padding:20px; text-align:center; font-size:12px; color:#777;">
                <p style="margin:0;">This is an automated confirmation email. Created by TherapEase</p>
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