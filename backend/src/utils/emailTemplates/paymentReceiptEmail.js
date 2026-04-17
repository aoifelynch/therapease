export const paymentReceiptEmail = ({ client, payment, receiptURL }) => {
  const clientName = client?.firstName || 'there';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Payment Receipt</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f7f5f2; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; margin:30px auto; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            <tr>
              <td style="background:#3A6F6F; padding:20px; text-align:center; color:#ffffff;">
                <h2 style="margin:0;">Payment Receipt</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px; color:#333333;">
                <p style="font-size:16px;">Hi ${clientName},</p>

                <p style="font-size:16px;">
                  Your payment was received successfully. Thank you.
                </p>

                <table width="100%" cellpadding="15" cellspacing="0" style="background:#f0ebe5; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td>
                      <p style="margin:5px 0;"><strong>Amount:</strong> EUR ${Number(payment?.amount || 0).toFixed(2)}</p>
                      <p style="margin:5px 0;"><strong>Payment Date:</strong> ${new Date(payment?.updatedAt || payment?.createdAt || Date.now()).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </td>
                  </tr>
                </table>

                ${receiptURL ? `
                <table width="100%" cellpadding="15" cellspacing="0" style="background:#f0ebe5; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td>
                      <p style="margin:5px 0;"><strong>Receipt Link:</strong></p>
                      <p style="margin:10px 0 0 0;">
                        <a href="${receiptURL}" style="color:#3A6F6F; text-decoration:none;">
                          View Stripe Receipt
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <p style="font-size:14px; color:#555;">
                  If you need anything else, please contact your therapist.
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