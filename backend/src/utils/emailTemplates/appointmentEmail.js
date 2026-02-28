export const appointmentEmail = ({ client, appointment }) => {
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
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">TherapEase</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Appointment Confirmed</h2>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hello ${client.firstName},
                  </p>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Your appointment has been successfully confirmed. Here are the details:
                  </p>
                  
                  <!-- Appointment Details Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                              <span style="color: #999999; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                              <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">${new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #999999; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                              <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">${appointment.startTime}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${appointment.type === 'online' && appointment.zoomLink ? `
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #eef4ff; border: 1px solid #dbe7ff; border-radius: 6px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="margin: 0 0 12px 0; color: #3b4a6b; font-size: 15px; font-weight: 600;">Online Session Link</p>
                        <a href="${appointment.zoomLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 20px; border-radius: 6px;">Join Zoom Meeting</a>
                        <p style="margin: 12px 0 0 0; color: #666666; font-size: 13px; word-break: break-all;">
                          If the button doesn't work, copy and paste this link: ${appointment.zoomLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    We look forward to seeing you!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #667eea;">The TherapEase Team</strong>
                  </p>
                  <p style="margin: 0; color: #cccccc; font-size: 12px;">
                    © ${new Date().getFullYear()} TherapEase. All rights reserved.
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