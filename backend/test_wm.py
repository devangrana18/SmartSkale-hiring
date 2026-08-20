import sys
sys.path.append('backend')
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4, landscape
from pypdf import PdfReader, PdfWriter
import io
import base64
from PIL import Image

def create_watermark_pdf(logo_base64_or_path: str, is_landscape: bool = False, opacity: float = 0.10) -> bytes:
    """
    Creates a 1-page PDF containing a perfectly centered, semi-transparent watermark logo.
    """
    packet = io.BytesIO()
    page_size = landscape(A4) if is_landscape else A4
    page_w, page_h = page_size
    
    can = canvas.Canvas(packet, pagesize=page_size)
    can.saveState()
    
    # Set transparency / opacity
    can.setFillAlpha(opacity)
    can.setStrokeAlpha(opacity)
    
    # Decode base64 if needed
    if logo_base64_or_path.startswith("data:image"):
        header, encoded = logo_base64_or_path.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        pil_img = Image.open(io.BytesIO(img_bytes))
    else:
        pil_img = Image.open(logo_base64_or_path)
        
    img_reader = io.BytesIO()
    pil_img.save(img_reader, format="PNG")
    img_reader.seek(0)
    
    # Draw centered watermark
    wm_size = 320 if not is_landscape else 260
    x = (page_w - wm_size) / 2
    y = (page_h - wm_size) / 2
    
    can.drawImage(logo_base64_or_path if not logo_base64_or_path.startswith("data:") else io.BytesIO(img_bytes), 
                  x, y, width=wm_size, height=wm_size, mask='auto')
    
    can.restoreState()
    can.save()
    
    packet.seek(0)
    return packet.getvalue()

print("Watermark function defined successfully.")
