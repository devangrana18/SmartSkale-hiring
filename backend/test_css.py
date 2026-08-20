import sys
sys.path.append('backend')
from app.services.pdf_service import pdf_service
from app.services.template_engine import template_engine
from xhtml2pdf import pisa
from pypdf import PdfReader
import io
import re

# Read test_offer.html
with open('backend/test_offer.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's write an updated HTML structure test
# In pdf rendering, we can have @page definition and clean table layouts
pdf_css = """
@page {
    size: a4 portrait;
    margin: 18mm 16mm 18mm 16mm;
}
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.35;
    color: #1a1a1a;
    background: #ffffff;
    margin: 0;
    padding: 0;
}
.page {
    width: 100%;
    background: #ffffff;
    margin: 0;
    padding: 0;
}
.lh-header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
}
.lh-header-table td {
    vertical-align: middle;
}
.lh-brand-name {
    font-size: 20pt;
    font-weight: bold;
    color: #1a1650;
    line-height: 1.1;
}
.lh-brand-tagline {
    font-size: 8.5pt;
    font-weight: bold;
    color: #534AB7;
    letter-spacing: 0.5px;
}
.lh-rule {
    height: 2px;
    background-color: #1a1650;
    margin-bottom: 14px;
}
.doc-title {
    font-size: 15pt;
    font-weight: bold;
    color: #1a1650;
    text-align: center;
    margin: 10px 0 14px;
}
.doc-refbox {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
}
.doc-refbox td {
    border: 1px solid #c8c8c8;
    padding: 4px 8px;
    font-size: 9pt;
}
.doc-details-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px;
}
.doc-details-table td {
    padding: 3px 6px;
    font-size: 9.5pt;
    vertical-align: top;
}
.dt-label {
    width: 25%;
    font-weight: bold;
    color: #333333;
}
.dt-value {
    width: 75%;
    color: #111111;
}
.doc-h2 {
    font-size: 10.5pt;
    font-weight: bold;
    color: #1a1650;
    margin: 10px 0 4px;
}
.doc-p {
    font-size: 9.5pt;
    margin: 0 0 6px;
    line-height: 1.35;
}
.doc-bullets {
    margin: 0 0 8px 18px;
    padding: 0;
}
.doc-bullets li {
    margin-bottom: 3px;
    font-size: 9.5pt;
}
.doc-note {
    font-size: 8.5pt;
    font-style: italic;
    color: #555555;
    margin: 4px 0 8px;
}
.doc-sig-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 14px;
    page-break-inside: avoid;
}
.doc-sig-table td {
    width: 50%;
    vertical-align: top;
    padding: 6px;
}
.sig-line {
    border-top: 1.5px solid #1a1650;
    margin-top: 4px;
    padding-top: 4px;
    font-size: 9pt;
}
.watermark {
    display: none;
}
"""

# Let's test compiling an updated template with these changes
print("Testing layout adjustments...")
