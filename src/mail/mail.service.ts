import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      this.logger.warn(
        '⚠️ SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env. Outgoing emails will be logged instead of sent.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`✅ Mail Transporter initialized successfully with ${host}:${port} (${user})`);
    } catch (err: any) {
      this.logger.error(`❌ Failed to initialize Mail Transporter: ${err.message}`);
    }
  }

  /**
   * Helper to ensure transporter exists or reload if credentials were added
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (!this.transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initTransporter();
    }
    return this.transporter;
  }

  /**
   * Send New Order Email Notification to Admin & Customer
   */
  async sendNewOrderNotification(order: any): Promise<boolean> {
    const transporter = this.getTransporter();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'admin@ardhimart.com';
    const storeName = process.env.STORE_NAME || 'ArdhiMart';
    const storeUrl = process.env.STORE_URL || 'https://ardhimart.com';
    const adminUrl = process.env.ADMIN_URL || 'https://admin.ardhimart.com';

    const items = order.order_items || [];
    const itemsHtml = items
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #eeeeee;">
          <td style="padding: 12px; vertical-align: middle;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.productName}" width="50" height="50" style="border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; margin-right: 8px; vertical-align: middle;" />`
                : ''
            }
            <span style="font-weight: 600; color: #1e293b; font-size: 13px;">${item.productName}</span>
          </td>
          <td style="padding: 12px; text-align: center; color: #64748b; font-size: 13px; font-weight: 600;">x${item.quantity}</td>
          <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 700; font-size: 13px;">৳${Number(item.price).toLocaleString()}</td>
          <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 800; font-size: 13px;">৳${(Number(item.price) * item.quantity).toLocaleString()}</td>
        </tr>`,
      )
      .join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order #${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #38bdf8; font-weight: 700;">🎉 New Order Received #${order.orderNumber}</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <!-- Customer Info Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">Customer & Delivery Details</h3>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Name:</strong> ${order.customerName}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> <a href="tel:${order.customerPhone}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${order.customerPhone}</a></p>
            ${order.customerEmail ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
            <p style="margin: 4px 0; font-size: 13px;"><strong>Address:</strong> ${order.shippingAddress}, ${order.city || ''}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Method:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: bold;">${order.paymentMethod || 'COD'}</span></p>
          </div>

          <!-- Items Table -->
          <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                <th style="padding: 8px 12px; border-radius: 8px 0 0 8px;">Product</th>
                <th style="padding: 8px 12px; text-align: center;">Qty</th>
                <th style="padding: 8px 12px; text-align: right;">Price</th>
                <th style="padding: 8px 12px; text-align: right; border-radius: 0 8px 8px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #475569;">
              <span>Subtotal:</span>
              <span style="font-weight: 600;">৳${Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #475569;">
              <span>Delivery Fee:</span>
              <span style="font-weight: 600;">৳${Number(order.shippingFee || 0).toLocaleString()}</span>
            </div>
            ${
              Number(order.discount || 0) > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #16a34a; font-weight: 600;">
                    <span>Discount:</span>
                    <span>-৳${Number(order.discount).toLocaleString()}</span>
                   </div>`
                : ''
            }
            <div style="border-top: 1px dashed #d8b4fe; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0f172a;">
              <span>Total Payable Amount:</span>
              <span style="color: #7e22ce;">৳${Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div style="text-align: center;">
            <a href="${adminUrl}/orders" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">View Order in Admin Panel</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Automated Notification from <a href="${storeUrl}" style="color: #6366f1; text-decoration: none;">${storeName}</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (!transporter) {
      this.logger.log(`[SIMULATED EMAIL] New Order #${order.orderNumber} notification to ${adminEmail} (Total: ৳${order.totalAmount})`);
      return false;
    }

    try {
      // Send to Admin
      await transporter.sendMail({
        from: `"${storeName} Orders" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🔔 New Order #${order.orderNumber} - ৳${Number(order.totalAmount).toLocaleString()} (${order.customerName})`,
        html: htmlContent,
      });
      this.logger.log(`✅ Order notification email sent to admin: ${adminEmail}`);

      // If customer has an email address, send them an order confirmation receipt too
      if (order.customerEmail && order.customerEmail.includes('@') && !order.customerEmail.endsWith('@customer.store')) {
        await transporter.sendMail({
          from: `"${storeName}" <${process.env.SMTP_USER}>`,
          to: order.customerEmail,
          subject: `Your ${storeName} Order Confirmation #${order.orderNumber}`,
          html: htmlContent,
        });
        this.logger.log(`✅ Customer order receipt sent to: ${order.customerEmail}`);
      }

      return true;
    } catch (err: any) {
      this.logger.error(`❌ Failed to send order notification email: ${err.message}`);
      return false;
    }
  }

  /**
   * Send Password Reset OTP Email (Valid for 5 Minutes)
   */
  async sendPasswordResetOtp(email: string, otp: string, remainingSeconds: number = 300): Promise<boolean> {
    const transporter = this.getTransporter();
    const storeName = process.env.STORE_NAME || 'ArdhiMart';
    const storeUrl = process.env.STORE_URL || 'https://ardhimart.com';
    const minutesLeft = Math.ceil(remainingSeconds / 60);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP - ${storeName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${storeName}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; font-weight: 500;">Account Security Verification</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Password Reset Request</h2>
          <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
            We received a request to reset the password for your account (<strong>${email}</strong>). Use the verification code below to complete your reset:
          </p>

          <!-- 6-Digit OTP Box -->
          <div style="background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 20px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ea580c; display: block; margin-left: 10px;">
              ${otp}
            </span>
          </div>

          <!-- Expiry Notice -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 10px 16px; font-size: 12px; color: #475569; font-weight: 600; margin-bottom: 24px;">
            ⏳ This code is valid for <strong>${minutesLeft} minutes</strong>. (If you requested a resend, your active code remains the same until expiration).
          </div>

          <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If you did not request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} <a href="${storeUrl}" style="color: #6366f1; text-decoration: none;">${storeName}</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (!transporter) {
      this.logger.log(`[SIMULATED EMAIL] Password Reset OTP for ${email}: ${otp} (Valid for ${minutesLeft} mins)`);
      return false;
    }

    try {
      await transporter.sendMail({
        from: `"${storeName} Security" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🔐 Your ${storeName} Password Reset OTP: ${otp}`,
        html: htmlContent,
      });
      this.logger.log(`✅ Password reset OTP sent to: ${email}`);
      return true;
    } catch (err: any) {
      this.logger.error(`❌ Failed to send password reset OTP to ${email}: ${err.message}`);
      return false;
    }
  }
}
