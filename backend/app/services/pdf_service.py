import io
import re
import os
import base64
from typing import Dict, Any, Tuple
from xhtml2pdf import pisa
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
from PIL import Image

from datetime import datetime
from app.config import settings
from app.services.template_engine import template_engine


class PDFService:
    def __init__(self):
        pass

    def _extract_logo_data_uri(self, html_content: str) -> str:
        """
        Extracts base64 logo data URI from HTML template.
        """
        m = re.search(r'id=["\'](?:watermark|header)-logo-img["\'][^>]*src=["\'](data:image/[^;]+;base64,[^"\']+)["\']', html_content)
        if not m:
            m = re.search(r'src=["\'](data:image/[^;]+;base64,[^"\']+)["\']', html_content)
        return m.group(1) if m else ""

    def _sanitize_html_for_pdf(self, html_content: str, is_landscape: bool = False) -> str:
        """
        Prepares HTML for xhtml2pdf rendering:
        - Strips web fonts to prevent network delays.
        - Resolves CSS variables.
        - Injects PDF print styles (@page, page-break rules, fixed dimensions).
        - Hides inline watermark from flow so it doesn't push content or render 100% opaque.
        """
        cleaned = re.sub(r'<link[^>]*fonts\.googleapis\.com[^>]*>', '', html_content)
        cleaned = re.sub(r'<link[^>]*fonts\.gstatic\.com[^>]*>', '', cleaned)

        css_vars = {
            '--ink': '#111111',
            '--ink-mid': '#333333',
            '--ink-light': '#666666',
            '--ink-faint': '#999999',
            '--rule': '#c8c8c8',
            '--rule-lite': '#e8e8e8',
            '--accent': '#1a1650',
            '--accent2': '#534AB7',
            '--white': '#ffffff',
            '--page-bg': '#ffffff',
            '--page-w': '100%',
            '--page-h': 'auto',
            '--margin-h': '0px',
            '--margin-v': '0px',
        }

        root_match = re.search(r':root\s*\{([^}]+)\}', cleaned)
        if root_match:
            for line in root_match.group(1).split(';'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    key = key.strip()
                    val = val.strip()
                    if key.startswith('--'):
                        css_vars[key] = val

        for var_name, var_value in css_vars.items():
            cleaned = cleaned.replace(f'var({var_name})', var_value)

        cleaned = re.sub(r'var\(--[a-zA-Z0-9_-]+\)', '#000000', cleaned)

        page_size_str = "a4 landscape" if is_landscape else "a4 portrait"
        margin_str = "10mm 10mm 10mm 10mm" if is_landscape else "12mm 14mm 12mm 14mm"

        is_certificate = "cert" in cleaned or "Certificate" in cleaned or "certificate" in cleaned

        if is_certificate:
            pdf_override_css = f"""
        <style>
        @page {{
            size: a4 portrait;
            margin: 8mm 8mm 8mm 8mm;
        }}
        html, body {{
            background: #ffffff !important;
            color: #0f0f0f !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9.5pt;
        }}
        .page-wrap, .page {{
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
        }}
        .cert {{
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
        }}
        .watermark {{
            display: none !important;
        }}
        .controls {{
            display: none !important;
        }}
        </style>
        """
        else:
            pdf_override_css = f"""
        <style>
        @page {{
            size: {page_size_str};
            margin: {margin_str};
        }}
        html, body {{
            background: #ffffff !important;
            color: #111111 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
        }}
        .page, .page-wrap, .cert {{
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            position: static !important;
            display: block !important;
        }}
        .watermark {{
            display: none !important;
        }}
        .lh-header {{
            padding: 0 0 6px 0 !important;
            display: block !important;
        }}
        .lh-header-table {{
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 4px !important;
        }}
        .lh-logo-icon {{
            width: 50px !important;
            height: 50px !important;
            display: block !important;
        }}
        .lh-brand-name {{
            font-size: 19pt !important;
            font-weight: bold !important;
            color: #1a1650 !important;
            line-height: 1.1 !important;
        }}
        .lh-brand-tagline {{
            font-size: 8.5pt !important;
            font-weight: bold !important;
            color: #534AB7 !important;
            letter-spacing: 0.5px !important;
        }}
        .lh-rule {{
            height: 2px !important;
            background: #1a1650 !important;
            margin-bottom: 10px !important;
        }}
        .lh-content {{
            padding: 0 !important;
            min-height: auto !important;
            display: block !important;
        }}
        .doc-section {{
            font-size: 9.5pt !important;
            line-height: 1.3 !important;
        }}
        .doc-title {{
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #1a1650 !important;
            text-align: center !important;
            margin: 2px 0 8px 0 !important;
        }}
        .doc-refbox {{
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 0 8px 0 !important;
            page-break-inside: avoid !important;
        }}
        .doc-refbox td {{
            border: 1px solid #c8c8c8 !important;
            padding: 3px 6px !important;
            font-size: 9pt !important;
        }}
        .doc-details-table {{
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 4px 0 8px 0 !important;
            page-break-inside: avoid !important;
        }}
        .doc-details-table td {{
            padding: 2px 4px !important;
            font-size: 9.5pt !important;
            vertical-align: top !important;
        }}
        .doc-details-table .dt-label {{
            width: 25% !important;
            font-weight: bold !important;
            color: #222222 !important;
        }}
        .doc-details-table .dt-value {{
            width: 75% !important;
        }}
        .doc-h2 {{
            font-size: 10pt !important;
            font-weight: bold !important;
            color: #1a1650 !important;
            margin: 8px 0 2px 0 !important;
            page-break-after: avoid !important;
        }}
        .doc-p {{
            margin: 0 0 4px 0 !important;
            font-size: 9.5pt !important;
            line-height: 1.3 !important;
        }}
        .doc-bullets {{
            margin: 0 0 5px 16px !important;
            padding: 0 !important;
        }}
        .doc-bullets li {{
            margin-bottom: 2px !important;
            font-size: 9.5pt !important;
        }}
        .doc-note {{
            font-size: 8.5pt !important;
            font-style: italic !important;
            color: #555555 !important;
            margin: 2px 0 5px 0 !important;
        }}
        .doc-sig-table {{
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
            page-break-inside: avoid !important;
        }}
        .doc-sig-table td {{
            width: 50% !important;
            vertical-align: top !important;
            padding: 4px 6px !important;
        }}
        .sig-imgs {{
            height: 55px !important;
            text-align: center !important;
            margin-bottom: 2px !important;
        }}
        .sig-stamp-img {{
            width: 55px !important;
            height: 55px !important;
            display: inline-block !important;
            vertical-align: middle !important;
        }}
        .sig-sign-img {{
            width: 80px !important;
            height: 35px !important;
            display: inline-block !important;
            vertical-align: middle !important;
            margin-left: -12px !important;
        }}
        .sig-line {{
            border-top: 1.5px solid #1a1650 !important;
            padding-top: 2px !important;
            font-size: 9pt !important;
        }}
        </style>
        """

        if '</head>' in cleaned:
            cleaned = cleaned.replace('</head>', pdf_override_css + '</head>')
        else:
            cleaned = pdf_override_css + cleaned

        return cleaned

    def _apply_watermark_overlay(self, pdf_bytes: bytes, logo_data_uri: str, is_landscape: bool = False, opacity: float = 0.08) -> bytes:
        """
        Overlays a centered, semi-transparent watermark logo on each page of the PDF.
        """
        if not logo_data_uri or "base64," not in logo_data_uri:
            return pdf_bytes

        try:
            encoded_data = logo_data_uri.split("base64,")[1]
            img_bytes = base64.b64decode(encoded_data)
            pil_img = Image.open(io.BytesIO(img_bytes))
            img_reader = ImageReader(pil_img)

            page_size = landscape(A4) if is_landscape else A4
            page_w, page_h = page_size

            # Create watermark single-page PDF
            wm_packet = io.BytesIO()
            can = canvas.Canvas(wm_packet, pagesize=page_size)
            can.saveState()
            can.setFillAlpha(opacity)
            can.setStrokeAlpha(opacity)

            wm_size = 300 if not is_landscape else 240
            x = (page_w - wm_size) / 2
            y = (page_h - wm_size) / 2

            can.drawImage(img_reader, x, y, width=wm_size, height=wm_size, mask='auto')
            can.restoreState()
            can.save()
            wm_packet.seek(0)

            orig_reader = PdfReader(io.BytesIO(pdf_bytes))
            writer = PdfWriter()

            for page in orig_reader.pages:
                # Merge watermark under page content
                page_wm_packet = io.BytesIO(wm_packet.getvalue())
                fresh_wm_page = PdfReader(page_wm_packet).pages[0]
                fresh_wm_page.merge_page(page)
                writer.add_page(fresh_wm_page)

            out_buf = io.BytesIO()
            writer.write(out_buf)
            return out_buf.getvalue()
        except Exception as e:
            print(f"Warning: Failed to apply watermark overlay: {e}")
            return pdf_bytes

    def _find_browser_executable(self) -> str:
        """
        Locates a Chromium/Edge browser executable for high-fidelity PDF rendering.
        """
        import shutil
        candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            shutil.which("google-chrome"),
            shutil.which("chrome"),
            shutil.which("msedge"),
            shutil.which("chromium"),
        ]
        for c in candidates:
            if c and os.path.exists(c):
                return c
        return ""

    def generate_pdf_bytes(self, doc_type: str, data: Dict[str, Any]) -> Tuple[bytes, str]:
        """
        Renders HTML from Jinja2 template and converts to PDF bytes.
        Uses headless Chrome/Edge for 100% preview fidelity, with xhtml2pdf fallback.
        Returns: (pdf_bytes, generated_file_name)
        """
        import tempfile
        import subprocess
        
        raw_html = template_engine.render_template(doc_type, data)
        name_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', str(data.get('name', 'candidate'))).strip('_')
        file_name = f"{doc_type}_{name_slug}.pdf"

        browser_path = self._find_browser_executable()
        if browser_path:
            try:
                with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f_html:
                    f_html.write(raw_html)
                    html_temp_path = f_html.name
                
                pdf_temp_path = html_temp_path.replace(".html", ".pdf")
                
                cmd = [
                    browser_path,
                    "--headless",
                    "--disable-gpu",
                    "--no-pdf-header-footer",
                    "--print-to-pdf-no-header",
                    f"--print-to-pdf={pdf_temp_path}",
                    html_temp_path
                ]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if res.returncode == 0 and os.path.exists(pdf_temp_path):
                    with open(pdf_temp_path, "rb") as f_pdf:
                        final_pdf_bytes = f_pdf.read()
                    
                    try:
                        os.remove(pdf_temp_path)
                    except Exception:
                        pass
                    try:
                        os.remove(html_temp_path)
                    except Exception:
                        pass
                    
                    return final_pdf_bytes, file_name
            except Exception as e:
                print(f"Browser PDF generation fallback due to: {e}")

        # Fallback: xhtml2pdf
        logo_data_uri = self._extract_logo_data_uri(raw_html)
        is_landscape = False

        clean_html = self._sanitize_html_for_pdf(raw_html, is_landscape=is_landscape)

        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(clean_html, dest=pdf_buffer)

        if pisa_status.err:
            raise RuntimeError(f"PDF generation failed with error code {pisa_status.err}")

        base_pdf_bytes = pdf_buffer.getvalue()

        # Apply transparent watermark layer
        final_pdf_bytes = self._apply_watermark_overlay(
            base_pdf_bytes,
            logo_data_uri=logo_data_uri,
            is_landscape=is_landscape,
            opacity=0.08
        )

        return final_pdf_bytes, file_name


    def save_pdf(self, doc_type: str, data: Dict[str, Any]) -> Tuple[str, str, str]:
        """
        Generates and saves the PDF file to disk.
        Returns: (file_path, file_name, document_number)
        """
        pdf_bytes, file_name = self.generate_pdf_bytes(doc_type, data)
        file_path = os.path.join(settings.GENERATED_DOCS_DIR, file_name)
        
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
            
        doc_num = data.get("certificate_no") or data.get("intern_id") or f"DOC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        return file_path, file_name, doc_num


pdf_service = PDFService()
