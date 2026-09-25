from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import ConceptMastery
from app.schemas.learning_engine import (
    KnowledgeGraphOut,
    KnowledgeNodeOut,
    KnowledgeEdgeOut,
    PrerequisiteCheckOut
)
from app.services.knowledge_graph_service import knowledge_graph_service

router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])

@router.get("/{subject_id}", response_model=KnowledgeGraphOut)
def get_subject_knowledge_graph(
    subject_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    graph = knowledge_graph_service.get_or_seed_knowledge_graph(subject_id, db)
    nodes = graph["nodes"]
    edges = graph["edges"]

    # Student masteries
    masteries = {
        m.concept_name.lower(): m for m in db.query(ConceptMastery).filter(
            ConceptMastery.student_id == current_student.id,
            ConceptMastery.subject_id == subject_id
        ).all()
    }

    nodes_out = []
    for n in nodes:
        m = masteries.get(n.name.lower())
        nodes_out.append(KnowledgeNodeOut(
            id=n.id,
            subject_id=n.subject_id,
            module_id=n.module_id,
            name=n.name,
            description=n.description,
            difficulty=n.difficulty,
            order_index=n.order_index,
            mastery_status=m.status if m else "UNKNOWN",
            mastery_score=m.score if m else 0
        ))

    edges_out = [
        KnowledgeEdgeOut(
            id=e.id,
            source_node_id=e.source_node_id,
            target_node_id=e.target_node_id,
            relationship_type=e.relationship_type
        )
        for e in edges
    ]

    return KnowledgeGraphOut(
        subject_id=subject.id,
        subject_name=subject.name,
        nodes=nodes_out,
        edges=edges_out
    )

@router.get("/{subject_id}/prerequisites/{node_id}", response_model=PrerequisiteCheckOut)
def check_prerequisites_for_concept(
    subject_id: str,
    node_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    check = knowledge_graph_service.check_prerequisites(
        student_id=current_student.id,
        subject_id=subject_id,
        node_id=node_id,
        db=db
    )
    return PrerequisiteCheckOut(
        can_proceed=check["can_proceed"],
        node_id=check["node_id"],
        node_name=check["node_name"],
        unmet_prerequisites=check["unmet_prerequisites"],
        recommendation=check["recommendation"]
    )
