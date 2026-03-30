export const paymentReceiptEmail = ({ client, payment, receiptURL }) => {
  const clientName = client?.firstName || 'there';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 36px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px;">
              <tr>
                <td style="padding: 28px 36px; text-align: center; background: linear-gradient(135deg, #4d7f6f 0%, #2f5f56 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 27px; font-weight: 600;">TherapEase</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 32px 36px;">
                  <h2 style="margin: 0 0 14px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Payment Receipt</h2>
                  <p style="margin: 0 0 18px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">Hi ${clientName},</p>
                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Your payment was received successfully. Thank you.
                  </p>

                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Amount</p>
                        <p style="margin: 0 0 14px 0; color: #111827; font-size: 18px; font-weight: 600;">EUR ${Number(payment?.amount || 0).toFixed(2)}</p>

                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px;">Payment Date</p>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${new Date(payment?.updatedAt || payment?.createdAt || Date.now()).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </td>
                    </tr>
                  </table>

                  ${receiptURL ? `
                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${receiptURL}" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 18px; border-radius: 6px;">View Stripe Receipt</a>
                  </div>
                  ` : ''}

                  <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
                    If you need anything else, please contact your therapist.
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