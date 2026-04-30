import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const orderData = await req.json();
    const { items, customer, totalPrice } = orderData;

    // 1. Save to Firestore
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    // 2. Setup Nodemailer
    const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

    if (!user || !pass) {
      throw new Error('Email configuration missing in environment variables');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const productDetails = items
      .map(
        (item) =>
          `<li><strong>${item.name}</strong> - Qty: ${item.quantity} - $${(
            item.price * item.quantity
          ).toFixed(2)}</li>`
      )
      .join('');

    const emailContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Gadgenix Registry</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #020617; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">🛍️ New Order Notification</h2>
          <p>A new order has been synthesized in the cloud registry. Details are indexed below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 13px; text-transform: uppercase;">Attribute</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 13px; text-transform: uppercase;">Value</th>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Order ID</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-family: monospace;">${orderRef.id}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Customer</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${customer.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">WhatsApp</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${customer.phone}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Address</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${customer.houseName}, ${customer.location}, ${customer.landmark ? `Near ${customer.landmark}, ` : ''}${customer.pincode}</td>
            </tr>
          </table>

          <h3 style="color: #1e293b; margin-bottom: 10px;">📦 Inventory Units</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Item Name</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Qty</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #e2e8f0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.name}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${typeof item.price === 'string' && item.price.startsWith('₹') ? item.price : `₹${item.price}`}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td colspan="2" style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Total Transaction Value</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #3b82f6; font-size: 16px;">${typeof totalPrice === 'string' && totalPrice.startsWith('₹') ? totalPrice : `₹${totalPrice}`}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: bold; text-align: center; text-transform: uppercase;">Electronic Signature Verified via Gadgenix Protocol</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Gadgenix Orders" <${user}>`,
      to: 'klgadjenix@gmail.com',
      subject: `New Order Alert: ${customer.fullName}`,
      html: emailContent,
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (error) {
    console.error('Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
