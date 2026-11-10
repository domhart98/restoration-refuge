
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingAddOn {
  name: string;
  price: number;
  durationMinutes: number;
}

interface BookingEmailDetails {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  durationMinutes: number;
  price: number; // Base service price
  addOns: BookingAddOn[];
  totalDurationMinutes: number;
  totalPrice: number;
  date: string;
  time: string;
  locationName: string;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-BB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-BB", {
    style: "currency",
    currency: "BBD",
  }).format(price);
}

// Escape dynamic values before inserting them into HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body style="margin:0;padding:0;background-color:#f5f3f8;font-family:Arial,Helvetica,sans-serif;color:#333333;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#f5f3f8;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#5b3b76;padding:32px 24px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:25px;font-weight:600;letter-spacing:0.5px;">
                      Restoration Refuge
                    </h1>
                    <p style="margin:8px 0 0;color:#eee5f5;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
                      Massage Studio
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 28px;">
                    ${content}
                  </td>
                </tr>

                <tr>
                  <td style="background:#faf8fc;padding:22px 28px;text-align:center;border-top:1px solid #eee8f3;">
                    <p style="margin:0;color:#6b6472;font-size:12px;line-height:1.6;">
                      Restoration Refuge Massage Studio<br />
                      Thank you for choosing us for your wellness.
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
}

function bookingDetailsHtml(booking: BookingEmailDetails): string {
  const addOnsHtml =
    booking.addOns.length > 0
      ? booking.addOns
          .map(
            (addOn) => `
              <tr>
                <td style="padding:8px 0;color:#5b5560;font-size:14px;">
                  ${escapeHtml(addOn.name)}
                  ${
                    addOn.durationMinutes > 0
                      ? `<span style="color:#888;font-size:12px;"> (+${addOn.durationMinutes} min)</span>`
                      : ""
                  }
                </td>
                <td align="right" style="padding:8px 0;color:#5b5560;font-size:14px;">
                  ${formatPrice(addOn.price)}
                </td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="2" style="padding:8px 0;color:#888;font-size:14px;">
            No add-ons selected
          </td>
        </tr>
      `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 0;color:#777;font-size:14px;">Service</td>
        <td align="right" style="padding:10px 0;color:#333;font-size:14px;font-weight:600;">
          ${escapeHtml(booking.serviceName)}
        </td>
      </tr>

      <tr>
        <td style="padding:10px 0;color:#777;font-size:14px;">Base duration</td>
        <td align="right" style="padding:10px 0;color:#333;font-size:14px;">
          ${booking.durationMinutes} minutes
        </td>
      </tr>

      <tr>
        <td style="padding:10px 0;color:#777;font-size:14px;">Base price</td>
        <td align="right" style="padding:10px 0;color:#333;font-size:14px;">
          ${formatPrice(booking.price)}
        </td>
      </tr>

      <tr>
        <td colspan="2" style="padding-top:18px;padding-bottom:6px;border-top:1px solid #eee;">
          <strong style="font-size:14px;color:#5b3b76;">Selected Add-ons</strong>
        </td>
      </tr>

      ${addOnsHtml}

      <tr>
        <td colspan="2" style="padding-top:16px;border-top:1px solid #eee;"></td>
      </tr>

      <tr>
        <td style="padding:8px 0;color:#777;font-size:14px;">Total duration</td>
        <td align="right" style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">
          ${booking.totalDurationMinutes} minutes
        </td>
      </tr>

      <tr>
        <td style="padding:12px 0;color:#5b3b76;font-size:16px;font-weight:bold;">
          Total
        </td>
        <td align="right" style="padding:12px 0;color:#5b3b76;font-size:20px;font-weight:bold;">
          ${formatPrice(booking.totalPrice)}
        </td>
      </tr>
    </table>
  `;
}

export async function sendBookingEmails(
  booking: BookingEmailDetails
): Promise<void> {
  const from = process.env.RESEND_FROM;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!process.env.RESEND_API_KEY || !from || !ownerEmail) {
    throw new Error("Booking email environment variables are not configured.");
  }

  const date = formatDate(booking.date);

  const customerContent = `
    <h2 style="margin:0 0 12px;color:#333;font-size:23px;">
      Your appointment is confirmed!
    </h2>

    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      Hello ${escapeHtml(booking.customerName)},<br /><br />
      Thank you for booking with Restoration Refuge. We look forward to welcoming you.
    </p>

    <div style="background:#f5f0fa;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
        Booking reference
      </p>
      <p style="margin:6px 0 0;color:#5b3b76;font-size:25px;font-weight:bold;">
        #${booking.bookingId}
      </p>
    </div>

    <h3 style="margin:0 0 12px;color:#5b3b76;font-size:17px;">
      Appointment Details
    </h3>

    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;">
      <strong>Date:</strong> ${escapeHtml(date)}<br />
      <strong>Time:</strong> ${escapeHtml(booking.time)}<br />
      <strong>Location:</strong> ${escapeHtml(booking.locationName)}
    </p>

    <div style="margin-top:24px;padding:20px;border:1px solid #eee;border-radius:8px;">
      <h3 style="margin:0 0 12px;color:#5b3b76;font-size:17px;">
        Booking Summary
      </h3>
      ${bookingDetailsHtml(booking)}
    </div>

    <p style="margin:24px 0 0;color:#666;font-size:14px;line-height:1.6;">
      If you need to make changes to your appointment, please contact the studio.
    </p>
  `;

  const ownerContent = `
    <h2 style="margin:0 0 12px;color:#333;font-size:23px;">
      New Appointment Booking
    </h2>

    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      A new massage appointment has been booked through your website.
    </p>

    <div style="background:#f5f0fa;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
        Booking reference
      </p>
      <p style="margin:6px 0 0;color:#5b3b76;font-size:25px;font-weight:bold;">
        #${booking.bookingId}
      </p>
    </div>

    <h3 style="margin:0 0 12px;color:#5b3b76;font-size:17px;">
      Customer Information
    </h3>

    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;">
      <strong>Name:</strong> ${escapeHtml(booking.customerName)}<br />
      <strong>Email:</strong> ${escapeHtml(booking.customerEmail)}<br />
      <strong>Phone:</strong> ${escapeHtml(booking.customerPhone)}
    </p>

    <h3 style="margin:0 0 12px;color:#5b3b76;font-size:17px;">
      Appointment Details
    </h3>

    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;">
      <strong>Date:</strong> ${escapeHtml(date)}<br />
      <strong>Time:</strong> ${escapeHtml(booking.time)}<br />
      <strong>Location:</strong> ${escapeHtml(booking.locationName)}
    </p>

    <div style="padding:20px;border:1px solid #eee;border-radius:8px;">
      <h3 style="margin:0 0 12px;color:#5b3b76;font-size:17px;">
        Booking Summary
      </h3>
      ${bookingDetailsHtml(booking)}
    </div>
  `;

  const addOnsText =
    booking.addOns.length > 0
      ? booking.addOns
          .map(
            (addOn) =>
              `- ${addOn.name}: ${formatPrice(addOn.price)}${
                addOn.durationMinutes > 0
                  ? ` (${addOn.durationMinutes} minutes)`
                  : ""
              }`
          )
          .join("\n")
      : "No add-ons selected";

  const customerText = [
    `Hello ${booking.customerName},`,
    "",
    "Your massage appointment has been confirmed!",
    "",
    `Booking reference: #${booking.bookingId}`,
    `Service: ${booking.serviceName}`,
    `Base duration: ${booking.durationMinutes} minutes`,
    `Base price: ${formatPrice(booking.price)}`,
    "",
    "Add-ons:",
    addOnsText,
    "",
    `Total duration: ${booking.totalDurationMinutes} minutes`,
    `Total price: ${formatPrice(booking.totalPrice)}`,
    "",
    `Date: ${date}`,
    `Time: ${booking.time}`,
    `Location: ${booking.locationName}`,
    "",
    "If you need to make changes to your appointment, please contact the studio.",
    "",
    "Restoration Refuge Massage Studio",
  ].join("\n");

  const ownerText = [
    "A new massage appointment has been booked.",
    "",
    `Booking reference: #${booking.bookingId}`,
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    `Phone: ${booking.customerPhone}`,
    "",
    `Service: ${booking.serviceName}`,
    `Base duration: ${booking.durationMinutes} minutes`,
    `Base price: ${formatPrice(booking.price)}`,
    "",
    "Add-ons:",
    addOnsText,
    "",
    `Total duration: ${booking.totalDurationMinutes} minutes`,
    `Total price: ${formatPrice(booking.totalPrice)}`,
    "",
    `Date: ${date}`,
    `Time: ${booking.time}`,
    `Location: ${booking.locationName}`,
  ].join("\n");

  const results = await Promise.all([
    resend.emails.send({
      from,
      to: booking.customerEmail,
      subject: `Appointment Confirmed | Restoration Refuge #${booking.bookingId}`,
      html: emailLayout(customerContent),
      text: customerText,
    }),
    resend.emails.send({
      from,
      to: ownerEmail,
      subject: `New Booking #${booking.bookingId} | Restoration Refuge`,
      html: emailLayout(ownerContent),
      text: ownerText,
    }),
  ]);

  for (const result of results) {
    if (result.error) {
      throw new Error(`Resend email failed: ${result.error.message}`);
    }
  }
}
