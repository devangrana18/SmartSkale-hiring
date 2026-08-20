import sys
import os
import pypdfium2 as pdfium

sys.path.insert(0, os.path.abspath("backend"))

# pyrefly: ignore [missing-import]
from app.services.pdf_service import pdf_service

offer_data = {
    "candidate_name": "Jane Doe",
    "role": "Senior Full Stack Engineer",
    "department": "Engineering",
    "joining_date": "2026-09-01",
    "ctc_inr": "18,00,000",
    "stipend_inr": "50,000",
    "location": "Bangalore / Remote",
    "doc_id": "SK-OFFER-2026-001",
    "valid_till": "2026-08-30",
    "reporting_to": "Engineering Director",
    "issue_date": "2026-08-20",
    "acceptance_deadline": "2026-08-27"
}

nda_data = {
    "candidate_name": "Jane Doe",
    "role": "Senior Full Stack Engineer",
    "joining_date": "2026-09-01",
    "doc_id": "SK-NDA-2026-001",
    "issue_date": "2026-08-20"
}

os.makedirs("scratch", exist_ok=True)

# 1. Offer letter
pdf_bytes, filename = pdf_service.generate_pdf_bytes("offer_letter", offer_data)
with open("scratch/test_offer_letter.pdf", "wb") as f:
    f.write(pdf_bytes)

pdf = pdfium.PdfDocument("scratch/test_offer_letter.pdf")
print(f"Offer letter page count: {len(pdf)}")
for i, page in enumerate(pdf):
    image = page.render(scale=2).to_pil()
    image.save(f"scratch/offer_letter_p{i+1}.png")
print("Saved offer letter pages.")

# 2. NDA
pdf_bytes_nda, filename_nda = pdf_service.generate_pdf_bytes("nda", nda_data)
with open("scratch/test_nda.pdf", "wb") as f:
    f.write(pdf_bytes_nda)

pdf_nda = pdfium.PdfDocument("scratch/test_nda.pdf")
print(f"NDA page count: {len(pdf_nda)}")
for i, page in enumerate(pdf_nda):
    image = page.render(scale=2).to_pil()
    image.save(f"scratch/nda_p{i+1}.png")
print("Saved NDA pages.")
