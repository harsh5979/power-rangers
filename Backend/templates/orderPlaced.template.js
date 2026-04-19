module.exports = function orderPlacedTicketTemplate(
  name,
  orderId,
  items,
  totalAmount,
  paymentStatus,
  orderStatus,
  expectedDeliveryDate
) {
  const itemList = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px dashed #333;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td width="70" style="vertical-align: top;">
                <img src="${item.product?.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop'}"
                  alt="${item.product?.name || 'Product'}"
                  style="width: 70px; height: 70px; border-radius: 8px; border: 2px solid #ff6b35; object-fit: cover;">
              </td>
              <td style="padding-left: 12px; vertical-align: top;">
                <div style="font-size: 15px; font-weight: 700; color: #fff;">${item.product?.name || 'Product'}</div>
                <div style="font-size: 13px; color: #ccc;">Size: ${item.size}</div>
                <div style="font-size: 13px; color: #ccc;">Qty: ${item.quantity}</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-size: 15px; color: #fff; font-weight: 700;">₹${(
                  item.price * item.quantity
                ).toFixed(2)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join('');

  const paymentStatusColor =
    paymentStatus === 'Paid'
      ? '#10b981'
      : paymentStatus === 'Pending'
      ? '#f59e0b'
      : '#ef4444';
  const paymentStatusText =
    paymentStatus === 'Paid'
      ? '✅ Paid'
      : paymentStatus === 'Pending'
      ? '🕓 Pending'
      : '❌ Failed';

  const orderStatusText =
    orderStatus === 'pending'
      ? 'Order Placed'
      : orderStatus === 'in transit'
      ? 'In Transit'
      : orderStatus === 'out for delivery'
      ? 'Out for Delivery'
      : orderStatus === 'delivered'
      ? 'Delivered'
      : 'Order Placed';

  const deliveryDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🎟️ Order Ticket - NorthSoul Clothing</title>
<style>
  @media only screen and (max-width: 600px) {
    .ticket { width: 100% !important; margin: 10px auto !important; }
    .ticket-inner { padding: 20px !important; }
  }
</style>
</head>
<body style="background: #0a0a0a; margin: 0; padding: 20px; font-family: 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td align="center">
        <div class="ticket" style="max-width: 600px; background: #111; border-radius: 16px; overflow: hidden; position: relative; box-shadow: 0 10px 25px rgba(255,107,53,0.2);">

          <!-- Top Strip -->
          <div style="height: 10px; background: linear-gradient(90deg, #ff6b35, #f7931e);"></div>

          <!-- Ticket Header -->
          <div style="text-align: center; padding: 25px; border-bottom: 1px dashed #444;">
            <div style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #ff6b35;">
              🎟️ NorthSoul Clothing
            </div>
            <div style="font-size: 13px; color: #aaa;">Official Order Ticket</div>
          </div>

          <!-- Ticket Content -->
          <div class="ticket-inner" style="padding: 30px; background: #1a1a1a;">
            <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 20px;">Hello ${name},</h2>
            <p style="color: #ccc; margin: 0 0 25px 0; font-size: 14px;">
              Thank you for shopping with <b>NorthSoul</b>. Your order is confirmed and being processed.
            </p>

            <!-- Order Info -->
            <table width="100%" style="margin-bottom: 25px;">
              <tr>
                <td style="color: #aaa; font-size: 14px;">Order ID</td>
                <td style="text-align: right; color: #fff; font-size: 14px; font-weight: 700;">#${orderId
                  .toString()
                  .slice(-8)}</td>
              </tr>
              <tr>
                <td style="color: #aaa; font-size: 14px;">Order Date</td>
                <td style="text-align: right; color: #fff; font-size: 14px;">${new Date().toLocaleDateString(
                  'en-IN'
                )}</td>
              </tr>
              <tr>
                <td style="color: #aaa; font-size: 14px;">Payment Status</td>
                <td style="text-align: right; color: ${paymentStatusColor}; font-size: 14px; font-weight: 700;">${paymentStatusText}</td>
              </tr>
              <tr>
                <td style="color: #aaa; font-size: 14px;">Order Status</td>
                <td style="text-align: right; color: #ff6b35; font-size: 14px; font-weight: 700;">${orderStatusText}</td>
              </tr>
              ${
                deliveryDate
                  ? `<tr>
                <td style="color: #aaa; font-size: 14px;">Expected Delivery</td>
                <td style="text-align: right; color: #10b981; font-size: 14px; font-weight: 700;">${deliveryDate}</td>
              </tr>`
                  : ''
              }
            </table>

            <!-- Item List -->
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 15px;">
              ${itemList}
            </table>

            <!-- Total -->
            <div style="text-align: right; border-top: 2px solid #ff6b35; padding-top: 15px;">
              <div style="font-size: 13px; color: #bbb;">Total Amount</div>
              <div style="font-size: 22px; font-weight: 900; color: #ff6b35;">₹${totalAmount}</div>
            </div>
          </div>

          <!-- Ticket Bottom Section -->
          <div style="background: #111; text-align: center; padding: 20px; border-top: 1px dashed #333;">
            <div style="font-size: 13px; color: #999; margin-bottom: 10px;">
              📍 NorthSoul Clothing | support@northsoulclothing.com | +91 98765 43210
            </div>
            <!-- Fake Barcode -->
            <div style="height: 40px; width: 80%; margin: 0 auto; background: repeating-linear-gradient(90deg, #fff 0, #fff 2px, #000 2px, #000 4px); border-radius: 4px;"></div>
            <p style="color: #666; font-size: 12px; margin-top: 12px;">
              © ${new Date().getFullYear()} NorthSoul Clothing — All rights reserved.
            </p>
          </div>

          <!-- Bottom Torn Effect -->
          <div style="height: 12px; background: radial-gradient(circle at 10px 6px, transparent 6px, #0a0a0a 6px); background-size: 20px 12px;"></div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
