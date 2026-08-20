import sys
sys.path.append('backend')
from app.services.pdf_service import pdf_service
from app.services.template_engine import template_engine
from xhtml2pdf import pisa
from pypdf import PdfReader
import io

data = {
    'name': 'Rahul Sharma',
    'intern_id': 'SKL-EMP-1001',
    'date': '20-08-2026',
    'address': '100, Sector 10, Noida, Uttar Pradesh, India',
    'email': 'rahul.sharma@example.com',
    'role': 'Full Stack Gen AI Intern',
    'duration': '3 Months',
    'domain': 'Full Stack Development',
    'start_date': '01-09-2026',
    'end_date': '30-11-2026',
    'issue_date': '01-12-2026'
}

raw_html = template_engine.render_template('offer_letter', data)
clean_html = pdf_service._sanitize_html_for_pdf(raw_html)

with open('backend/test_offer.html', 'w', encoding='utf-8') as f:
    f.write(clean_html)

buf = io.BytesIO()
pisa.CreatePDF(clean_html, dest=buf)
with open('backend/test_offer.pdf', 'wb') as f:
    f.write(buf.getvalue())

reader = PdfReader(buf)
print('Offer Letter Pages:', len(reader.pages))
