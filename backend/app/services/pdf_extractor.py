import fitz  # PyMuPDF
from typing import List, Dict, Any

class PDFExtractor:
    def __init__(self, min_char_threshold: int = 40):
        self.min_char_threshold = min_char_threshold

    def extract_document(self, file_path: str) -> Dict[str, Any]:
        """
        Extracts page-by-page text, layout blocks, and detects scanned/empty pages.
        """
        doc = fitz.open(file_path)
        page_count = len(doc)
        pages_data: List[Dict[str, Any]] = []

        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text("text") or ""
            clean_text = text.strip()
            char_count = len(clean_text)

            image_list = page.get_images(full=True)
            has_images = len(image_list) > 0

            # Detect if page is likely scanned (very low text but contains embedded images)
            is_scanned_candidate = (char_count < self.min_char_threshold) and has_images

            # Extract detailed text blocks with coordinates and font sizes if available
            blocks = page.get_text("blocks")
            extracted_blocks = []
            for b in blocks:
                # b = (x0, y0, x1, y1, "text", block_no, block_type)
                if len(b) >= 5 and b[4].strip():
                    extracted_blocks.append({
                        "bbox": [b[0], b[1], b[2], b[3]],
                        "text": b[4].strip(),
                        "type": b[6] if len(b) > 6 else 0
                    })

            pages_data.append({
                "page_number": page_num + 1,
                "text": clean_text,
                "char_count": char_count,
                "has_images": has_images,
                "is_scanned_candidate": is_scanned_candidate,
                "blocks": extracted_blocks
            })

        doc.close()

        return {
            "page_count": page_count,
            "pages": pages_data
        }

pdf_extractor = PDFExtractor()
