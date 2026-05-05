import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import nodemailer from "nodemailer";

dotenv.config();

console.log("Starting initialization...");

let resend: any = null;
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  try {
    console.log("Starting server function...");
    
    // Move all initializations inside try-catch to prevent startup crashes
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured.");

    try {
      if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
        console.log("Resend initialized.");
      }
    } catch (e) {
      console.error("Resend initialization error:", e);
    }

    const app = express();
    const PORT = 3000;

    // Security enhancement: Helmet for secure headers and limit body size
    const helmet = (await import("helmet")).default;
    app.use(helmet({
      contentSecurityPolicy: false, // Disabled for preview environment compatibility
    }));
    app.use(express.json({ limit: '10mb' }));

  // Image Upload API
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "gadgenix_uploads",
        timeout: 60000 
      });

      res.json({ url: result.secure_url });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      res.status(500).json({ error: "Image upload protocol failure" });
    }
  });

  // Order Notification API (Unified)
  app.post("/api/notify-order", async (req, res) => {
    const { orderData } = req.body;
    if (!orderData) return res.status(400).json({ error: "Order data is required" });

    try {
      const { customer, items, total } = orderData;
      
      const itemsList = items.map((item: any) => 
        `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`
      ).join("");

      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
          <h1 style="color: #000; border-bottom: 3px solid #f97316; padding-bottom: 10px;">New Order Detected</h1>
          <div style="background: #f8fafc; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #f97316;">Customer Details:</h3>
            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
          </div>

          <div style="background: #f8fafe; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #3b82f6;">Logistic Coordinates:</h3>
            <p><strong>House/Bldg:</strong> ${customer.houseInfo}</p>
            <p><strong>Address:</strong> ${customer.address}</p>
            <p><strong>Landmark:</strong> ${customer.landmark || 'N/A'}</p>
            <p><strong>Pincode:</strong> ${customer.pincode}</p>
          </div>

          ${customer.notes ? `
          <div style="background: #fefce8; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid #fef08a;">
            <h3 style="margin-top: 0; color: #a16207;">Extra Products / Special Instructions:</h3>
            ${customer.extraQuantity > 0 ? `<p><strong>Extra Units Requested:</strong> ${customer.extraQuantity}</p>` : ''}
            <p style="white-space: pre-wrap;">${customer.notes}</p>
          </div>
          ` : customer.extraQuantity > 0 ? `
          <div style="background: #fefce8; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid #fef08a;">
            <h3 style="margin-top: 0; color: #a16207;">Extra Products:</h3>
            <p><strong>Extra Units Requested:</strong> ${customer.extraQuantity}</p>
          </div>
          ` : ''}

          <div style="background: #fff7ed; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid #fed7aa;">
            <h3 style="margin-top: 0; color: #ea580c;">Transaction Protocol:</h3>
            <p><strong>Method:</strong> ${customer.paymentMethod?.toUpperCase()}</p>
            ${orderData.codFee > 0 ? `<p><strong>COD Processing Fee:</strong> ₹${orderData.codFee}</p>` : ''}
            <p><strong>Total Due:</strong> ₹${total}</p>
          </div>
          
          <h3 style="margin-top: 30px;">Items Registry:</h3>
          <ul style="list-style: none; padding: 0;">
            ${items.map((item: any) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.name} <span style="color: #666;">x ${item.quantity}</span> 
                <strong style="float: right;">₹${item.price * item.quantity}</strong>
              </li>
            `).join('')}
          </ul>
          
          <h2 style="margin-top: 20px; color: #f97316; text-align: right;">Total Amount: ₹${total}</h2>
          ${orderData.id ? `<p style="color: #94a3b8; font-size: 10px;">ID: ${orderData.id}</p>` : ''}
          
          <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666; text-align: center;">This is an automated notification from Gadgenix Command Center.</p>
        </div>
      `;

      let sent = false;
      const adminEmail = "klgadjenix@gmail.com";

      // 1. Try Resend if configured
      if (resend) {
        try {
          console.log("Attempting Resend delivery...");
          // In Resend onboarding mode, we can only send to the verified email.
          // We'll try sending to admin first.
          const { data: adminRes, error: adminErr } = await resend.emails.send({
            from: "Gadgenix Store <onboarding@resend.dev>",
            to: [adminEmail],
            subject: `New Order Alert: ₹${total}`,
            html: emailHtml,
          });

          if (!adminErr) {
            console.log("Admin notification sent via Resend:", adminRes?.id);
            sent = true;

            // Try sending to customer as a separate attempt (often fails on free tier/unverified domains)
            if (customer.email && customer.email !== 'not-provided') {
               try {
                 await resend.emails.send({
                   from: "Gadgenix Store <onboarding@resend.dev>",
                   to: [customer.email],
                   subject: `Order Confirmed: Gadgenix Store`,
                   html: emailHtml.replace('New Order Detected', 'Order Confirmed - Gadgenix'),
                 });
                 console.log("Customer confirmation sent via Resend");
               } catch (custErr) {
                 console.warn("Resend customer confirmation skipped (likely unverified recipient in Sandbox):", custErr);
               }
            }
          } else {
            console.warn("Resend admin delivery failed (Validation Error usually means to/from mismatch):", adminErr);
          }
        } catch (e) {
          console.error("Resend execution exception:", e);
        }
      }

      // 2. Try Nodemailer/Gmail Fallback if Resend failed or wasn't configured
      if (!sent) {
        const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

        if (gmailUser && gmailPass) {
          try {
            console.log("Attempting Gmail Nodemailer fallback...");
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: gmailUser, pass: gmailPass },
            });

            // Verify connection configuration first
            await transporter.verify();

            const emailBatch = [
              transporter.sendMail({
                from: `"Gadgenix Store" <${gmailUser}>`,
                to: adminEmail,
                subject: `New Order Alert [Admin]: ₹${total}`,
                html: emailHtml,
              })
            ];

            if (customer.email && customer.email !== 'not-provided') {
              emailBatch.push(
                transporter.sendMail({
                  from: `"Gadgenix Store" <${gmailUser}>`,
                  to: customer.email,
                  subject: `Order Confirmed: Gadgenix Store`,
                  html: emailHtml.replace('New Order Detected', 'Order Confirmed - Gadgenix')
                                .replace('Customer Details:', 'Your Details:')
                                .replace('Electronic Signature Verified', 'Thank you for your order!')
                })
              );
            }

            await Promise.all(emailBatch);
            console.log("Email sent successfully via Gmail Nodemailer batch");
            sent = true;
          } catch (e: any) {
            console.error("Gmail Nodemailer fallback failed. Root cause:", e.message);
            if (e.message.includes('535-5.7.8')) {
              console.error("DEBUG: Gmail authentication rejected. Ensure GMAIL_APP_PASSWORD is a 16-character App Password, not your regular password.");
            }
          }
        } else {
          console.warn("Nodemailer fallback skipped: Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env");
        }
      }

      if (sent) {
        res.json({ success: true });
      } else {
        res.status(503).json({ error: "Email configuration missing or services offline. Check .env for Resend or Gmail credentials." });
      }
    } catch (error) {
      console.error("Order Notification Error:", error);
      res.status(500).json({ error: "Internal notification protocol failure" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
  }
}

startServer();
