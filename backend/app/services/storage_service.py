import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class StorageService:
    def __init__(self, base_dir: str = "uploads"):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.max_size_bytes = getattr(settings, "MAX_UPLOAD_SIZE_MB", 25) * 1024 * 1024

    def validate_pdf(self, file: UploadFile, header_bytes: bytes):
        filename = file.filename or ""
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF documents are supported."
            )
        
        # Verify PDF magic bytes (%PDF-)
        if not header_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or corrupted PDF file header."
            )

    async def save_uploaded_pdf(self, file: UploadFile) -> tuple[str, int]:
        """
        Validates and saves the uploaded PDF file.
        Returns: (relative_storage_path, file_size_in_bytes)
        """
        now = datetime.now()
        target_dir = self.base_dir / "documents" / str(now.year) / f"{now.month:02d}"
        target_dir.mkdir(parents=True, exist_ok=True)

        unique_id = str(uuid.uuid4())
        file_path = target_dir / f"{unique_id}.pdf"

        # Read first 1024 bytes to check magic header
        header = await file.read(1024)
        self.validate_pdf(file, header)

        # Write header and rest of file
        total_size = len(header)
        with open(file_path, "wb") as buffer:
            buffer.write(header)
            while chunk := await file.read(1024 * 64):  # 64KB chunks
                total_size += len(chunk)
                if total_size > self.max_size_bytes:
                    # Clean up file and raise error
                    buffer.close()
                    if file_path.exists():
                        file_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {self.max_size_bytes // (1024 * 1024)}MB."
                    )
                buffer.write(chunk)

        # Return relative storage path from backend root
        relative_path = str(file_path.relative_to(self.base_dir.parent))
        return relative_path, total_size

    def get_absolute_path(self, relative_storage_path: str) -> Path:
        full_path = (self.base_dir.parent / relative_storage_path).resolve()
        # Prevent directory traversal
        if not str(full_path).startswith(str(self.base_dir)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to storage path")
        return full_path

    def delete_file(self, relative_storage_path: str):
        try:
            full_path = self.get_absolute_path(relative_storage_path)
            if full_path.exists():
                full_path.unlink()
        except Exception as e:
            # Log error but don't crash
            print(f"Warning: failed to delete file {relative_storage_path}: {e}")

    def file_exists(self, relative_storage_path: str) -> bool:
        try:
            return self.get_absolute_path(relative_storage_path).is_file()
        except Exception:
            return False

storage_service = StorageService()
