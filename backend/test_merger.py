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
from PIL import Image

def build_watermark_layer(logo_base64: str, is_landscape: bool = False, opacity: float = 0.08) -> PdfReader:
    packet = io.BytesIO()
    page_size = landscape(A4) if is_landscape else A4
    page_w, page_h = page_size
    
    can = canvas.Canvas(packet, pagesize=page_size)
    can.saveState()
    can.setFillAlpha(opacity)
    can.setStrokeAlpha(opacity)
    
    if "base64," in logo_base64:
        encoded = logo_base64.split("base64,")[1]
    else:
        encoded = logo_base64
        
    img_data = base64.b64decode(encoded)
    pil_img = Image.open(io.BytesIO(img_data))
    img_reader = ImageReader(pil_img)
    
    wm_size = 320 if not is_landscape else 260
    x = (page_w - wm_size) / 2
    y = (page_h - wm_size) / 2
    
    can.drawImage(img_reader, x, y, width=wm_size, height=wm_size, mask='auto')
    can.restoreState()
    can.save()
    packet.seek(0)
    return PdfReader(packet)

def apply_watermark_to_pdf(pdf_bytes: bytes, logo_base64: str, is_landscape: bool = False) -> bytes:
    if not logo_base64:
        return pdf_bytes
    try:
        wm_reader = build_watermark_layer(logo_base64, is_landscape=is_landscape)
        wm_page = wm_reader.pages[0]
        
        orig_reader = PdfReader(io.BytesIO(pdf_bytes))
        writer = PdfWriter()
        
        for page in orig_reader.pages:
            # Create a fresh copy of wm_page for merge
            p = PdfReader(io.BytesIO(build_watermark_layer(logo_base64, is_landscape=is_landscape).stream.getvalue())).pages[0]
            # Merge watermark under page content
            p.merge_page(page)
            writer.add_page(p)
            
        out_buf = io.BytesIO()
        writer.write(out_buf)
        return out_buf.getvalue()
    except Exception as e:
        print("Watermark error:", e)
        return pdf_bytes

print("Watermark merger ready.")
