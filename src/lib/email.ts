import { Resend } from "resend";

let resend: Resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const ADMIN_EMAIL = "info.afilpm@gmail.com";

export async function sendNewOrderEmail(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: { name: string; price: number; quantity: number; size: string }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  address: { line1: string; city: string; state: string; pincode: string };
}) {
  try {
    const itemList = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.size}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price.toLocaleString("en-IN")}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#18181b;color:white;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;font-size:24px">🔔 New Order Received!</h1>
          <p style="margin:8px 0 0;opacity:0.8;font-size:14px">WOX.11 Store</p>
        </div>

        <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e5e7eb">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Order Number</td>
                <td style="padding:4px 0;text-align:right;font-weight:bold;font-size:14px">${order.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Customer</td>
                <td style="padding:4px 0;text-align:right;font-size:14px">${order.customerName}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Phone</td>
                <td style="padding:4px 0;text-align:right;font-size:14px">${order.customerPhone}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Email</td>
                <td style="padding:4px 0;text-align:right;font-size:14px">${order.customerEmail || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Payment</td>
                <td style="padding:4px 0;text-align:right;font-size:14px">
                  <span style="background:${order.paymentStatus === "PAID" ? "#dcfce7" : "#fef3c7"};color:${order.paymentStatus === "PAID" ? "#16a34a" : "#d97706"};padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600">
                    ${order.paymentMethod.toUpperCase()} - ${order.paymentStatus}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:14px">Total</td>
                <td style="padding:4px 0;text-align:right;font-weight:bold;font-size:18px;color:#18181b">₹${order.total.toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </div>

          <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e5e7eb">
            <h3 style="margin:0 0 8px;font-size:14px;color:#374151">Items Ordered</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:8px;text-align:left;font-weight:600;color:#6b7280">Product</th>
                  <th style="padding:8px;text-align:center;font-weight:600;color:#6b7280">Size</th>
                  <th style="padding:8px;text-align:center;font-weight:600;color:#6b7280">Qty</th>
                  <th style="padding:8px;text-align:right;font-weight:600;color:#6b7280">Price</th>
                </tr>
              </thead>
              <tbody>${itemList}</tbody>
            </table>
          </div>

          <div style="background:white;border-radius:8px;padding:16px;border:1px solid #e5e7eb">
            <h3 style="margin:0 0 8px;font-size:14px;color:#374151">Delivery Address</h3>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">
              ${order.address.line1}<br/>
              ${order.address.city}, ${order.address.state} - ${order.address.pincode}
            </p>
          </div>

          <div style="text-align:center;margin-top:24px">
            <a href="https://wox11.vercel.app/wox/admin/orders" style="display:inline-block;background:#18181b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View in Admin Panel →
            </a>
          </div>
        </div>
      </div>
    `;

    await getResend().emails.send({
      from: "WOX.11 Store <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `🔔 New Order ${order.orderNumber} - ₹${order.total.toLocaleString("en-IN")}`,
      html,
    });

    console.log(`Admin notification sent for order ${order.orderNumber}`);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}
