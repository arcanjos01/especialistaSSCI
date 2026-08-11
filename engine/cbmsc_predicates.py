"""CBMSC domain predicates used by the execution pilot.

This module intentionally remains outside the generic engine core.
"""

from __future__ import annotations

from typing import Any, Mapping

from engine.criterion_ir import (
    DomainPredicateResolver,
    EngineResult,
    ProcessMemory,
    ResolverContext,
    TypedReference,
)


PREDICATE_ID = "RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY"

RESPONSIBILITY_KIND = "REQUIRED_TECHNICAL_RESPONSIBILITY"
DRT_KIND = "DRT"

DRT_EVIDENCE_KEY = "drt_evidence"
COUNCIL_STATE_KEY = "COUNCIL_STATE"
PROFESSIONAL_REGULARITY_KEY = "PROFESSIONAL_REGULARITY"

SANTA_CATARINA = "SC"
BRAZIL = "BR"
IRREGULAR = "IRREGULAR"


class ProfessionalRegularityResolver(DomainPredicateResolver):
    """Evaluate professional regularity according to the Engine contract."""

    def resolve(
        self,
        arguments: Mapping[str, Any],
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> EngineResult:
        subject = arguments["subject"]

        if not isinstance(subject, TypedReference):
            raise TypeError("subject must be a TypedReference")

        if subject.kind != RESPONSIBILITY_KIND:
            raise ValueError(
                "subject must reference "
                "REQUIRED_TECHNICAL_RESPONSIBILITY"
            )

        responsibility = process_memory.read(subject)

        if not isinstance(responsibility, Mapping):
            raise ValueError(
                "responsibility Process Memory record must be a mapping"
            )

        evidence = responsibility.get(DRT_EVIDENCE_KEY)

        if not isinstance(evidence, (tuple, list)) or len(evidence) != 1:
            return EngineResult.MANUAL_REVIEW

        drt_reference = evidence[0]

        if not isinstance(drt_reference, TypedReference):
            raise TypeError(
                "DRT evidence must contain TypedReference instances"
            )

        if drt_reference.kind != DRT_KIND:
            raise ValueError(
                "DRT evidence reference must have kind DRT"
            )

        if not process_memory.contains(drt_reference):
            return EngineResult.MANUAL_REVIEW

        drt = process_memory.read(drt_reference)

        if not isinstance(drt, Mapping):
            raise ValueError("DRT Process Memory record must be a mapping")

        council_state = drt.get(COUNCIL_STATE_KEY)

        if council_state not in {SANTA_CATARINA, BRAZIL}:
            return EngineResult.MANUAL_REVIEW

        regularity = drt.get(PROFESSIONAL_REGULARITY_KEY)

        if regularity == IRREGULAR:
            return EngineResult.FALSE

        return EngineResult.TRUE
