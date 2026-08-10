import nodemailer from "nodemailer";
import { SITE_CONFIG } from "@/lib/siteConfig";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  await getTransporter().sendMail({
    from: `"${SITE_CONFIG.name} Admin" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
