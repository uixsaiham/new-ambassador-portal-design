from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/policy", tags=["policy"])

_DOCS = ("rewards_terms", "privacy_policy")


@router.get("/document/{document}", response_model=schemas.PolicyDocumentResponse)
def get_current_document(document: str, db: Session = Depends(get_db)):
    """Public: the CURRENT version of a legal document (the verbatim archived HTML
    the standalone page and the accept-terms modal both render). Optionally pin an
    older version via ?version=N to reproduce exactly what a past user accepted."""
    if document not in _DOCS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown document")
    row = crud.get_policy_document(db, document)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not published")
    return row


@router.get("/document/{document}/{version}", response_model=schemas.PolicyDocumentResponse)
def get_document_version(document: str, version: str, db: Session = Depends(get_db)):
    """Public: a specific archived version, for reproducing exactly what was accepted."""
    if document not in _DOCS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown document")
    row = crud.get_policy_document(db, document, version=version)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
    return row
