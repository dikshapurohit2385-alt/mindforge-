from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.learning_engine import (
    KnowledgeNode,
    KnowledgeEdge,
    ConceptMastery,
    ModuleCompletion,
    RevisionItem
)
from app.models.academic import Subject, Chapter, Module
from app.models.document import Document, DocumentStatus

class KnowledgeGraphService:
    def get_or_seed_knowledge_graph(self, subject_id: str, db: Session) -> Dict[str, Any]:
        """
        Retrieves knowledge nodes and edges for a subject.
        If none exist, builds them automatically based on the subject's modules.
        """
        nodes = db.query(KnowledgeNode).filter(KnowledgeNode.subject_id == subject_id).order_by(KnowledgeNode.order_index).all()
        if not nodes:
            # Seed graph nodes from modules or standard curriculum
            modules = db.query(Module).join(Chapter, Module.chapter_id == Chapter.id).filter(
                Chapter.subject_id == subject_id
            ).order_by(Chapter.order_index, Module.order_index).all()

            if modules:
                prev_node = None
                for idx, mod in enumerate(modules):
                    node = KnowledgeNode(
                        subject_id=subject_id,
                        module_id=mod.id,
                        name=mod.title,
                        description=mod.description or f"Core concept covering {mod.title}",
                        difficulty="BEGINNER" if idx < 2 else ("INTERMEDIATE" if idx < 4 else "ADVANCED"),
                        order_index=idx
                    )
                    db.add(node)
                    db.flush()

                    if prev_node:
                        # Link linear prerequisite edge
                        edge = KnowledgeEdge(
                            source_node_id=prev_node.id,
                            target_node_id=node.id,
                            relationship_type="PREREQUISITE"
                        )
                        db.add(edge)
                    prev_node = node
                db.commit()
                nodes = db.query(KnowledgeNode).filter(KnowledgeNode.subject_id == subject_id).order_by(KnowledgeNode.order_index).all()

        edges = []
        if nodes:
            node_ids = [n.id for n in nodes]
            edges = db.query(KnowledgeEdge).filter(
                KnowledgeEdge.source_node_id.in_(node_ids),
                KnowledgeEdge.target_node_id.in_(node_ids)
            ).all()

        return {"nodes": nodes, "edges": edges}

    def check_prerequisites(
        self,
        student_id: str,
        subject_id: str,
        node_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Checks whether student meets all prerequisites for a target knowledge node.
        If a prerequisite concept is WEAK or missing, warns the student.
        """
        node = db.query(KnowledgeNode).filter(KnowledgeNode.id == node_id).first()
        if not node:
            return {"can_proceed": False, "node_id": node_id, "node_name": "Unknown", "unmet_prerequisites": [], "recommendation": "Concept not found."}

        prereq_edges = db.query(KnowledgeEdge).filter(
            KnowledgeEdge.target_node_id == node_id,
            KnowledgeEdge.relationship_type == "PREREQUISITE"
        ).all()

        unmet = []
        for edge in prereq_edges:
            source = edge.source_node
            # Check concept mastery
            mastery = db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.concept_name.ilike(f"%{source.name}%")
            ).first()

            # Check module completion
            is_completed = False
            if source.module_id:
                comp = db.query(ModuleCompletion).filter(
                    ModuleCompletion.student_id == student_id,
                    ModuleCompletion.module_id == source.module_id
                ).first()
                if comp:
                    is_completed = True

            # If mastery is explicitly WEAK or not completed
            if (mastery and mastery.status == "WEAK") or (not is_completed and not mastery):
                unmet.append({
                    "prerequisite_id": source.id,
                    "prerequisite_name": source.name,
                    "reason": f"Mastery is weak or incomplete ({mastery.status if mastery else 'Not Started'})."
                })

        if unmet:
            names = [u["prerequisite_name"] for u in unmet]
            rec = f"Revise {', '.join(names)} before continuing with {node.name}."
            return {
                "can_proceed": False,
                "node_id": node.id,
                "node_name": node.name,
                "unmet_prerequisites": unmet,
                "recommendation": rec
            }

        return {
            "can_proceed": True,
            "node_id": node.id,
            "node_name": node.name,
            "unmet_prerequisites": [],
            "recommendation": f"All prerequisites verified! You are ready to study {node.name}."
        }

    def generate_adaptive_learning_path(
        self,
        student_id: str,
        subject_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Produces the sequential personalized learning path:
        ✓ COMPLETED
        ⚠ NEEDS_REVISION
        → CURRENT
        🔒 LOCKED
        """
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise ValueError("Subject not found")

        modules = db.query(Module).join(Chapter, Module.chapter_id == Chapter.id).filter(
            Chapter.subject_id == subject_id
        ).order_by(Chapter.order_index, Module.order_index).all()

        completions = {
            c.module_id: c for c in db.query(ModuleCompletion).filter(
                ModuleCompletion.student_id == student_id
            ).all()
        }

        revisions = {
            r.topic_name.lower(): r for r in db.query(RevisionItem).filter(
                RevisionItem.student_id == student_id,
                RevisionItem.subject_id == subject_id,
                RevisionItem.is_completed == False
            ).all()
        }

        masteries = {
            m.concept_name.lower(): m for m in db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.subject_id == subject_id
            ).all()
        }

        # Check approved documents per module
        doc_counts = {}
        docs = db.query(Document).filter(
            Document.subject_id == subject_id,
            Document.status == DocumentStatus.APPROVED
        ).all()
        for d in docs:
            if d.module_id:
                doc_counts[d.module_id] = doc_counts.get(d.module_id, 0) + 1

        path_modules = []
        found_current = False
        completed_count = 0

        for idx, mod in enumerate(modules):
            is_done = mod.id in completions
            has_rev = (mod.title.lower() in revisions)
            mastery_rec = masteries.get(mod.title.lower())

            status = "LOCKED"
            is_locked = True
            unmet_prereqs = []

            if is_done:
                completed_count += 1
                if has_rev or (mastery_rec and mastery_rec.status == "WEAK"):
                    status = "NEEDS_REVISION"
                    is_locked = False
                else:
                    status = "COMPLETED"
                    is_locked = False
            elif not found_current:
                # Check prerequisites: are earlier topics completed or at least medium?
                earlier_done = True
                for prev in path_modules:
                    if prev["status"] == "LOCKED":
                        earlier_done = False
                        unmet_prereqs.append(prev["title"])
                    elif prev["status"] == "NEEDS_REVISION":
                        unmet_prereqs.append(f"{prev['title']} (Needs Revision)")

                if earlier_done:
                    status = "CURRENT"
                    is_locked = False
                    found_current = True
                else:
                    status = "LOCKED"
                    is_locked = True
            else:
                # Later topics after CURRENT
                status = "LOCKED"
                is_locked = True
                unmet_prereqs = [modules[idx-1].title] if idx > 0 else []

            path_modules.append({
                "id": mod.id,
                "chapter_id": mod.chapter_id,
                "chapter_title": mod.chapter.title if mod.chapter else "Chapter",
                "title": mod.title,
                "description": mod.description,
                "order_index": idx,
                "status": status,
                "is_locked": is_locked,
                "unmet_prerequisites": unmet_prereqs,
                "has_documents": doc_counts.get(mod.id, 0) > 0,
                "mastery_score": mastery_rec.score if mastery_rec else (100 if is_done else 0)
            })

        total = len(modules)
        overall_progress = int((completed_count / total * 100)) if total > 0 else 0
        current_mod = next((m for m in path_modules if m["status"] == "CURRENT"), None)

        return {
            "subject_id": subject.id,
            "subject_name": subject.name,
            "total_modules": total,
            "completed_modules": completed_count,
            "overall_progress_percentage": overall_progress,
            "current_module": current_mod,
            "modules": path_modules
        }

knowledge_graph_service = KnowledgeGraphService()
