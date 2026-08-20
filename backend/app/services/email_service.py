import smtplib
import ssl
import os
import base64
import logging
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


def build_email_html_body(
    recipient_name: str,
    document_type: str,
    sender_name: str = "SmartSkale HR Team",
    custom_message: Optional[str] = None,
) -> str:
    """Generate a branded HTML email body for document delivery."""

    doc_label_map = {
        "offer_letter": "Internship Offer Letter",
        "internship_certificate": "Internship Completion Certificate",
        "nda": "Non-Disclosure Agreement (NDA)",
        "letterhead": "Official SmartSkale Letter",
    }
    doc_label = doc_label_map.get(document_type, document_type.replace("_", " ").title())

    default_message = (
        f"Please find your <strong>{doc_label}</strong> attached to this email as a PDF document. "
        "Please review it carefully and reach out to the HR team if you have any questions."
    )
    body_message = custom_message or default_message

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartSkale Document: {doc_label}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1650 0%,#534AB7 100%);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;text-align:center;line-height:44px;font-size:22px;font-weight:900;color:#fff;vertical-align:middle;">S</div>
                    <span style="font-size:20px;font-weight:800;color:#ffffff;margin-left:12px;vertical-align:middle;">SmartSkale</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                      {doc_label}
                    </h1>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Official SmartSkale HR Document</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Dear <strong>{recipient_name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">{body_message}</p>

              <!-- Document Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Document Attached</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">📎 {doc_label}.pdf</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.7;">
                If you have any questions or concerns regarding this document, please do not hesitate to contact the HR team.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#475569;">We look forward to working with you!</p>

              <p style="margin:0;font-size:14px;color:#1e293b;">
                Warm regards,<br>
                <strong style="color:#1a1650;">{sender_name}</strong><br>
                <span style="color:#94a3b8;font-size:12px;">SmartSkale · Noida, Uttar Pradesh, India</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an official communication from SmartSkale HR Portal.<br>
                &copy; 2026 SmartSkale. All rights reserved. &middot; 
                <a href="https://smartskale.com" style="color:#534AB7;text-decoration:none;">smartskale.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


class EmailService:
    """Email delivery service supporting both Resend HTTPS API (cloud-safe) and standard SMTP."""

    def __init__(self):
        self.resend_api_key: Optional[str] = getattr(settings, "RESEND_API_KEY", None)
        self.smtp_host: str = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        self.smtp_port: int = int(getattr(settings, "SMTP_PORT", 587))
        self.smtp_user: str = getattr(settings, "SMTP_USERNAME", "")
        self.smtp_password: str = getattr(settings, "SMTP_PASSWORD", "")
        self.from_email: str = getattr(settings, "SMTP_FROM_EMAIL", self.smtp_user) or "onboarding@resend.dev"
        self.from_name: str = getattr(settings, "SMTP_FROM_NAME", "SmartSkale HR")

    @property
    def is_configured(self) -> bool:
        """Returns True if either Resend API or SMTP credentials are configured."""
        return bool(self.resend_api_key or (self.smtp_user and self.smtp_password))

    def _send_via_resend(
        self,
        recipient_email: str,
        subject: str,
        html_body: str,
        attachment_bytes: Optional[bytes] = None,
        attachment_filename: str = "document.pdf",
    ) -> dict:
        """Send email via Resend HTTPS REST API (Port 443 - zero cloud firewall block)."""
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json",
            }
            
            # Format sender (default to onboarding@resend.dev if using default Resend test domain)
            sender = f"{self.from_name} <{self.from_email}>"
            if not self.from_email or "gmail" in self.from_email.lower():
                sender = f"{self.from_name} <onboarding@resend.dev>"

            payload = {
                "from": sender,
                "to": [recipient_email],
                "subject": subject,
                "html": html_body,
            }

            if attachment_bytes:
                b64_content = base64.b64encode(attachment_bytes).decode("utf-8")
                payload["attachments"] = [
                    {
                        "filename": attachment_filename,
                        "content": b64_content,
                    }
                ]

            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code in (200, 201):
                logger.info(f"Resend API email sent successfully to {recipient_email}")
                return {"success": True, "message": f"Document emailed successfully to {recipient_email}."}
            else:
                err_json = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_msg = err_json.get("message", resp.text)
                logger.error(f"Resend API error: {resp.status_code} - {err_msg}")
                return {"success": False, "message": f"Resend API error: {err_msg}"}
        except Exception as e:
            logger.error(f"Error calling Resend API: {e}")
            return {"success": False, "message": f"Email API error: {str(e)}"}

    def _send_via_smtp(
        self,
        recipient_email: str,
        msg: MIMEMultipart,
    ) -> dict:
        """Send email via standard SMTP (handles Port 465 SSL and Port 587 STARTTLS)."""
        try:
            if self.smtp_port == 465:
                # SSL direct connection
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=20) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, [recipient_email], msg.as_string())
            else:
                # STARTTLS connection (Port 587)
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, [recipient_email], msg.as_string())

            return {"success": True, "message": f"Document emailed successfully to {recipient_email}."}

        except smtplib.SMTPAuthenticationError:
            logger.error(f"SMTP authentication failed for {self.smtp_user}")
            return {
                "success": False,
                "message": (
                    "SMTP authentication failed. Verify SMTP_USERNAME and SMTP_PASSWORD "
                    "(use a 16-character Google App Password, not your standard account password)."
                ),
            }
        except smtplib.SMTPRecipientsRefused:
            logger.error(f"Recipient email refused: {recipient_email}")
            return {
                "success": False,
                "message": f"The recipient email address '{recipient_email}' was refused by the mail server.",
            }
        except (OSError, smtplib.SMTPException) as e:
            logger.error(f"SMTP Network/Socket error while sending to {recipient_email}: {e}")
            # Detect Render / cloud host SMTP port blocking
            if "101" in str(e) or "unreachable" in str(e).lower() or "timed out" in str(e).lower():
                return {
                    "success": False,
                    "message": (
                        "Outbound SMTP network unreachable. Free cloud hosts (e.g. Render) block direct SMTP ports. "
                        "Please add RESEND_API_KEY to your Render environment variables for HTTPS email delivery."
                    ),
                }
            return {"success": False, "message": f"SMTP error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}

    def send_document_email(
        self,
        recipient_email: str,
        recipient_name: str,
        document_type: str,
        pdf_path: Optional[str] = None,
        pdf_bytes: Optional[bytes] = None,
        pdf_filename: str = "SmartSkale_Document.pdf",
        subject: Optional[str] = None,
        custom_message: Optional[str] = None,
        sender_display_name: Optional[str] = None,
    ) -> dict:
        """Send a generated PDF document to an employee via email."""
        if not self.is_configured:
            return {
                "success": False,
                "message": (
                    "Email service is not configured. Please set RESEND_API_KEY (recommended) or "
                    "SMTP_USERNAME and SMTP_PASSWORD in your environment variables."
                ),
            }

        # Resolve PDF attachment bytes
        attachment_bytes: Optional[bytes] = pdf_bytes
        if not attachment_bytes and pdf_path:
            if not os.path.exists(pdf_path):
                return {"success": False, "message": f"PDF file not found at path: {pdf_path}"}
            with open(pdf_path, "rb") as f:
                attachment_bytes = f.read()

        if not attachment_bytes:
            return {"success": False, "message": "No PDF content available to attach."}

        doc_label_map = {
            "offer_letter": "Internship Offer Letter",
            "internship_certificate": "Internship Completion Certificate",
            "nda": "Non-Disclosure Agreement (NDA)",
            "letterhead": "Official SmartSkale Letter",
        }
        doc_label = doc_label_map.get(document_type, document_type.replace("_", " ").title())
        email_subject = subject or f"SmartSkale — Your {doc_label}"

        # HTML body
        html_body = build_email_html_body(
            recipient_name=recipient_name,
            document_type=document_type,
            sender_name=sender_display_name or self.from_name,
            custom_message=custom_message,
        )

        # 1. Prefer Resend API if API Key is available (Port 443 HTTPS - 100% reliable on Render/Cloud)
        if self.resend_api_key:
            return self._send_via_resend(
                recipient_email=recipient_email,
                subject=email_subject,
                html_body=html_body,
                attachment_bytes=attachment_bytes,
                attachment_filename=pdf_filename,
            )

        # 2. Fallback to standard SMTP
        msg = MIMEMultipart("alternative")
        msg["Subject"] = email_subject
        msg["From"] = f"{sender_display_name or self.from_name} <{self.from_email}>"
        msg["To"] = recipient_email
        msg["Reply-To"] = self.from_email

        msg.attach(MIMEText(html_body, "html"))
        pdf_part = MIMEApplication(attachment_bytes, _subtype="pdf")
        pdf_part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
        msg.attach(pdf_part)

        return self._send_via_smtp(recipient_email, msg)

    def send_otp_email(
        self,
        recipient_email: str,
        recipient_name: str,
        otp_code: str,
    ) -> dict:
        """Send a password reset OTP verification code to a user."""
        if not self.is_configured:
            logger.warning(
                f"[DEV MODE] Email not configured. OTP for {recipient_email} is: {otp_code}"
            )
            return {
                "success": True,
                "dev_otp": otp_code,
                "message": f"Password reset code generated: {otp_code}",
            }

        subject = "SmartSkale — Password Reset Verification Code"
        html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartSkale Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1650 0%,#534AB7 100%);padding:32px 40px;">
              <div style="display:inline-block;width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;vertical-align:middle;">S</div>
              <span style="font-size:18px;font-weight:800;color:#ffffff;margin-left:10px;vertical-align:middle;">SmartSkale HR Portal</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Hello <strong>{recipient_name}</strong>,</p>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                We received a request to reset your password for your SmartSkale account. Use the 6-digit verification code below to proceed:
              </p>
              
              <!-- OTP Code Display -->
              <div style="background:#f8fafc;border:2px dashed #534AB7;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                <span style="font-size:32px;font-weight:900;letter-spacing:8px;color:#1a1650;font-family:monospace;">{otp_code}</span>
                <p style="margin:8px 0 0;font-size:12px;color:#64748b;font-weight:500;">Valid for 10 minutes</p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
                If you did not request this password reset, please ignore this email or contact the administrator immediately.
              </p>
              <p style="margin:20px 0 0;font-size:13px;color:#1e293b;">
                Best regards,<br>
                <strong style="color:#1a1650;">SmartSkale Security Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; 2026 SmartSkale. All rights reserved. &middot; smartskale.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        # 1. Resend API
        if self.resend_api_key:
            return self._send_via_resend(
                recipient_email=recipient_email,
                subject=subject,
                html_body=html_body,
            )

        # 2. SMTP
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = recipient_email
        msg["Reply-To"] = self.from_email
        msg.attach(MIMEText(html_body, "html"))

        return self._send_via_smtp(recipient_email, msg)


email_service = EmailService()

