import sys
sys.path.append('backend')
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
import io
import re
import base64
from xhtml2pdf import pisa

def test_pipeline():
    with open('backend/templates/smartskale_offerletter.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract logo base64
    m = re.search(r'id=["\'](?:header|watermark)-logo-img["\'][^>]*src=["\'](data:image/[^;]+;base64,[^"\']+)["\']', content)
    if not m:
        m = re.search(r'src=["\'](data:image/[^;]+;base64,[^"\']+)["\']', content)
        
    logo_data_uri = m.group(1) if m else None
    print("Found logo URI:", bool(logo_data_uri))

    # Clean HTML for PDF:
    # 1. Structure header as table
    # 2. Add explicit image sizes
    # 3. Add @page CSS
    # 4. Hide inline watermark from HTML flow so ReportLab applies it cleanly
    
    css_fix = """
    <style>
    @page {
        size: a4 portrait;
        margin: 15mm 14mm 15mm 14mm;
    }
    body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 9.5pt !important;
        color: #111111 !important;
    }
    .page {
        width: 100% !important;
        min-height: auto !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
    }
    .watermark {
        display: none !important;
    }
    .lh-header {
        padding: 0 0 10px 0 !important;
        display: block !important;
    }
    .lh-header table {
        width: 100% !important;
    }
    .lh-logo-icon {
        width: 50px !important;
        height: 50px !important;
    }
    .lh-brand-name {
        font-size: 20pt !important;
        font-weight: bold !important;
        color: #1a1650 !important;
    }
    .lh-brand-tagline {
        font-size: 8.5pt !important;
        font-weight: bold !important;
        color: #534AB7 !important;
    }
    .lh-rule {
        height: 2px !important;
        background: #1a1650 !important;
        margin-bottom: 12px !important;
    }
    .lh-content {
        padding: 0 !important;
        min-height: auto !important;
    }
    .doc-section {
        font-size: 9.5pt !important;
        line-height: 1.32 !important;
    }
    .doc-title {
        font-size: 14.5pt !important;
        font-weight: bold !important;
        color: #1a1650 !important;
        text-align: center !important;
        margin: 6px 0 12px 0 !important;
    }
    .doc-refbox {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 0 0 10px 0 !important;
    }
    .doc-refbox td {
        border: 1px solid #999999 !important;
        padding: 3px 6px !important;
        font-size: 9pt !important;
    }
    .doc-details-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 6px 0 10px 0 !important;
    }
    .doc-details-table td {
        padding: 2px 4px !important;
        font-size: 9.5pt !important;
        vertical-align: top !important;
    }
    .dt-label {
        width: 24% !important;
        font-weight: bold !important;
        color: #222222 !important;
    }
    .dt-value {
        width: 76% !important;
    }
    .doc-h2 {
        font-size: 10pt !important;
        font-weight: bold !important;
        color: #1a1650 !important;
        margin: 8px 0 3px 0 !important;
    }
    .doc-p {
        margin: 0 0 5px 0 !important;
        font-size: 9.5pt !important;
        line-height: 1.32 !important;
    }
    .doc-bullets {
        margin: 0 0 6px 16px !important;
        padding: 0 !important;
    }
    .doc-bullets li {
        margin-bottom: 2px !important;
        font-size: 9.5pt !important;
    }
    .doc-note {
        font-size: 8.5pt !important;
        font-style: italic !important;
        color: #555555 !important;
        margin: 2px 0 6px 0 !important;
    }
    .doc-sig-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 10px !important;
        page-break-inside: avoid !important;
    }
    .doc-sig-table td {
        width: 50% !important;
        vertical-align: top !important;
        padding: 4px 6px !important;
    }
    .sig-imgs {
        height: 65px !important;
        text-align: center !important;
    }
    .sig-stamp-img {
        width: 65px !important;
        height: 65px !important;
        display: inline-block !important;
    }
    .sig-sign-img {
        width: 80px !important;
        height: 35px !important;
        display: inline-block !important;
        margin-left: -20px !important;
    }
    .sig-line {
        border-top: 1.5px solid #1a1650 !important;
        padding-top: 3px !important;
        font-size: 9pt !important;
    }
    </style>
    """

    # Inject css_fix into html
    html_mod = content.replace("</head>", css_fix + "</head>")
    
    # Replace header with table if it's flex
    header_pattern = r'<div class="lh-header"[^>]*>[\s\S]*?</div>\s*<div class="lh-rule">'
    # Let's inspect how header is structured
    print("Pattern check...")

test_pipeline()
