import shutil
from typing import Optional
import fitz
from PIL import Image
import io

class OCRService:
    def __init__(self):
        self._tesseract_available: Optional[bool] = None

    def is_available(self) -> bool:
        if self._tesseract_available is None:
            # Check if tesseract binary exists in PATH
            has_binary = shutil.which("tesseract") is not None
            if not has_binary:
                self._tesseract_available = False
            else:
                try:
                    import pytesseract
                    self._tesseract_available = True
                except ImportError:
                    self._tesseract_available = False
        return self._tesseract_available

    def extract_text_from_pdf_page(self, doc_path: str, page_number: int) -> Optional[str]:
        """
        Renders the PDF page to a high-resolution image and runs OCR if Tesseract is available.
        Returns extracted text, or None if OCR is unavailable.
        """
        if not self.is_available():
            return None

        try:
            import pytesseract
            doc = fitz.open(doc_path)
            page = doc[page_number - 1]
            
            # Render page to pixmap with 2x scale for higher OCR fidelity
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            doc.close()

            img = Image.open(io.BytesIO(img_bytes))
            ocr_text = pytesseract.image_to_string(img)
            return ocr_text.strip()
        except Exception as e:
            print(f"OCR execution warning on page {page_number}: {e}")
            return None

ocr_service = OCRService()
