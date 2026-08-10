"""Generic infrastructure for the agnostic Criterion execution contract.

This module does not implement domain predicates. Domain-specific behavior is
provided only through explicitly constructed, static PredicateContract objects.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from copy import deepcopy
from dataclasses import dataclass
from enum import Enum
from numbers import Real
from types import MappingProxyType
from typing import Any, Iterable, Mapping, Sequence


class EngineContractError(ValueError):
    """Base error for invalid IR, registry, argument, or result contracts."""


class PredicateNotFoundError(EngineContractError):
    """Raised when a predicate identifier is absent from the static registry."""


class ArgumentContractError(EngineContractError):
    """Raised when predicate arguments do not match their declared schema."""


class ResultContractError(EngineContractError):
    """Raised when a resolver returns a result outside its declared contract."""


class CompositionContractError(EngineContractError):
    """Raised when an expression uses an unsupported composition state."""


class EngineResult(str, Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    UNKNOWN = "UNKNOWN"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class ArgumentKind(str, Enum):
    ANY = "ANY"
    BOOLEAN = "BOOLEAN"
    NUMBER = "NUMBER"
    TEXT = "TEXT"
    REFERENCE = "REFERENCE"
    COLLECTION = "COLLECTION"


@dataclass(frozen=True)
class TypedReference:
    """A generic typed reference into Process Memory."""

    kind: str
    identifier: str

    def __post_init__(self) -> None:
        if not isinstance(self.kind, str) or not self.kind.strip():
            raise ArgumentContractError("reference kind must be a non-empty string")
        if not isinstance(self.identifier, str) or not self.identifier.strip():
            raise ArgumentContractError(
                "reference identifier must be a non-empty string"
            )


@dataclass(frozen=True)
class ArgumentSpec:
    name: str
    kind: ArgumentKind
    required: bool = True
    many: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name.strip():
            raise ArgumentContractError("argument name must be non-empty")
        if not isinstance(self.kind, ArgumentKind):
            raise ArgumentContractError("argument kind must be an ArgumentKind")


@dataclass(frozen=True)
class ArgumentSchema:
    specs: tuple[ArgumentSpec, ...] = ()

    def __post_init__(self) -> None:
        names = [spec.name for spec in self.specs]
        if len(names) != len(set(names)):
            raise ArgumentContractError("argument names must be unique")

    def validate(self, arguments: Mapping[str, Any]) -> Mapping[str, Any]:
        if not isinstance(arguments, Mapping):
            raise ArgumentContractError("arguments must be a named mapping")

        known = {spec.name for spec in self.specs}
        unknown = set(arguments) - known
        if unknown:
            raise ArgumentContractError(
                f"unknown arguments: {', '.join(sorted(unknown))}"
            )

        validated = {}
        for spec in self.specs:
            if spec.name not in arguments:
                if spec.required:
                    raise ArgumentContractError(
                        f"missing required argument: {spec.name}"
                    )
                continue

            value = arguments[spec.name]
            values = self._values_for(spec, value)
            for item in values:
                self._validate_kind(spec, item)
            validated[spec.name] = tuple(values) if spec.many else value

        return MappingProxyType(validated)

    @staticmethod
    def _values_for(spec: ArgumentSpec, value: Any) -> tuple[Any, ...]:
        if not spec.many:
            return (value,)
        if not isinstance(value, (list, tuple, frozenset)):
            raise ArgumentContractError(
                f"argument {spec.name} must be a collection"
            )
        return tuple(value)

    @staticmethod
    def _validate_kind(spec: ArgumentSpec, value: Any) -> None:
        valid = {
            ArgumentKind.ANY: True,
            ArgumentKind.BOOLEAN: isinstance(value, bool),
            ArgumentKind.NUMBER: isinstance(value, Real) and not isinstance(value, bool),
            ArgumentKind.TEXT: isinstance(value, str),
            ArgumentKind.REFERENCE: isinstance(value, TypedReference),
            ArgumentKind.COLLECTION: isinstance(value, (list, tuple, frozenset)),
        }[spec.kind]
        if not valid:
            raise ArgumentContractError(
                f"argument {spec.name} is not of type {spec.kind.value}"
            )


class ProcessMemory(ABC):
    """Read-only execution view; it exposes no document or extraction API."""

    @abstractmethod
    def contains(self, reference: TypedReference) -> bool:
        raise NotImplementedError

    @abstractmethod
    def read(self, reference: TypedReference) -> Any:
        raise NotImplementedError


class ImmutableProcessMemory(ProcessMemory):
    """Small immutable memory implementation for execution and unit tests."""

    __slots__ = ("_values",)

    def __init__(self, values: Mapping[TypedReference, Any] | None = None) -> None:
        source = {} if values is None else values
        if not isinstance(source, Mapping):
            raise TypeError("Process Memory values must be a mapping")
        if any(not isinstance(key, TypedReference) for key in source):
            raise TypeError("Process Memory keys must be TypedReference instances")
        self._values = MappingProxyType(
            {key: deepcopy(value) for key, value in source.items()}
        )

    def contains(self, reference: TypedReference) -> bool:
        return reference in self._values

    def read(self, reference: TypedReference) -> Any:
        if reference not in self._values:
            raise KeyError(reference)
        return deepcopy(self._values[reference])


@dataclass(frozen=True)
class ResolverContext:
    criterion_id: str
    requirement_id: str

    def __post_init__(self) -> None:
        if not self.criterion_id or not self.requirement_id:
            raise EngineContractError(
                "resolver context requires criterion and requirement identifiers"
            )


class DomainPredicateResolver(ABC):
    """Interface implemented later by a domain adapter, not by this module."""

    @abstractmethod
    def resolve(
        self,
        arguments: Mapping[str, Any],
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> EngineResult:
        raise NotImplementedError


@dataclass(frozen=True)
class PredicateContract:
    predicate_id: str
    argument_schema: ArgumentSchema
    allowed_results: frozenset[EngineResult]
    resolver: DomainPredicateResolver

    def __post_init__(self) -> None:
        if not self.predicate_id or not self.predicate_id.strip():
            raise EngineContractError("predicate_id must be non-empty")
        if not self.allowed_results:
            raise EngineContractError("predicate must allow at least one result")
        if EngineResult.NOT_APPLICABLE in self.allowed_results:
            raise EngineContractError(
                "NOT_APPLICABLE belongs to Criterion applicability, not predicates"
            )
        if not isinstance(self.resolver, DomainPredicateResolver):
            raise EngineContractError(
                "resolver must implement DomainPredicateResolver"
            )

    def validate_result(self, result: EngineResult) -> None:
        if result not in self.allowed_results:
            raise ResultContractError(
                f"{self.predicate_id} returned disallowed result {result.value}"
            )


class PredicateRegistry:
    """Static registry with an immutable contract set.

    Construction fixes the PredicateContracts available to the Engine. The
    registry does not freeze or otherwise control the mutability of resolver
    instances; resolver lifecycle remains outside the registry.
    """

    __slots__ = ("_contracts",)

    def __init__(self, contracts: Iterable[PredicateContract] = ()) -> None:
        entries = {}
        for contract in contracts:
            if contract.predicate_id in entries:
                raise EngineContractError(
                    f"duplicate predicate_id: {contract.predicate_id}"
                )
            entries[contract.predicate_id] = contract
        self._contracts = MappingProxyType(entries)

    def resolve(self, predicate_id: str) -> PredicateContract:
        try:
            return self._contracts[predicate_id]
        except KeyError as exc:
            raise PredicateNotFoundError(
                f"predicate not found: {predicate_id}"
            ) from exc

    def __contains__(self, predicate_id: str) -> bool:
        return predicate_id in self._contracts


@dataclass(frozen=True)
class Traceability:
    declaration_source: str | None = None


@dataclass(frozen=True)
class CriterionIR:
    """Internal Criterion representation.

    ASSERT Criteria use expected_result=TRUE as defined by Documento 10.
    The field remains explicit so the IR records the declared expectation.
    """

    criterion_id: str
    requirement_id: str
    applicability: Expression | None
    expression: Expression
    expected_result: EngineResult
    nonconformity_on_false: str | None
    traceability: Traceability

    def __post_init__(self) -> None:
        if not self.criterion_id or not self.requirement_id:
            raise EngineContractError(
                "Criterion IR requires criterion_id and requirement_id"
            )
        if self.expected_result is not EngineResult.TRUE:
            raise EngineContractError(
                "Criterion assertion expected_result must be TRUE"
            )


@dataclass(frozen=True)
class TraceEntry:
    requirement_id: str
    criterion_id: str
    predicate_id: str
    arguments: Mapping[str, Any]
    result: EngineResult
    memory_references: tuple[TypedReference, ...]

    def __post_init__(self) -> None:
        object.__setattr__(
            self, "arguments", MappingProxyType(dict(self.arguments))
        )


@dataclass(frozen=True)
class Evaluation:
    result: EngineResult
    trace: tuple[TraceEntry, ...] = ()


@dataclass(frozen=True)
class CriterionEvaluation:
    criterion_id: str
    requirement_id: str
    result: EngineResult
    traceability: Traceability
    trace: tuple[TraceEntry, ...]


class Expression(ABC):
    @abstractmethod
    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        raise NotImplementedError


@dataclass(frozen=True)
class PredicateCall(Expression):
    predicate_id: str
    arguments: Mapping[str, Any]

    def __post_init__(self) -> None:
        if not self.predicate_id:
            raise EngineContractError("predicate call requires predicate_id")
        object.__setattr__(
            self, "arguments", MappingProxyType(dict(self.arguments))
        )

    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        contract = engine.registry.resolve(self.predicate_id)
        arguments = contract.argument_schema.validate(self.arguments)
        result = contract.resolver.resolve(arguments, process_memory, context)
        if not isinstance(result, EngineResult):
            raise ResultContractError(
                f"{self.predicate_id} resolver returned a non-EngineResult"
            )
        contract.validate_result(result)
        entry = TraceEntry(
            requirement_id=context.requirement_id,
            criterion_id=context.criterion_id,
            predicate_id=self.predicate_id,
            arguments=arguments,
            result=result,
            memory_references=tuple(_references_in(arguments)),
        )
        return Evaluation(result=result, trace=(entry,))


@dataclass(frozen=True)
class Exists(Expression):
    """Generic primitive that checks only TypedReference presence in memory.

    It does not query entity semantics or interpret the referenced value.
    """

    reference: TypedReference

    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        result = (
            EngineResult.TRUE
            if process_memory.contains(self.reference)
            else EngineResult.FALSE
        )
        entry = TraceEntry(
            requirement_id=context.requirement_id,
            criterion_id=context.criterion_id,
            predicate_id="EXISTS",
            arguments=MappingProxyType({"reference": self.reference}),
            result=result,
            memory_references=(self.reference,),
        )
        return Evaluation(result=result, trace=(entry,))


@dataclass(frozen=True)
class All(Expression):
    expressions: tuple[Expression, ...]

    def __init__(self, expressions: Sequence[Expression]) -> None:
        object.__setattr__(self, "expressions", tuple(expressions))

    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        evaluations = tuple(
            expression.evaluate(engine, process_memory, context)
            for expression in self.expressions
        )
        return Evaluation(
            result=_combine_all(item.result for item in evaluations),
            trace=tuple(entry for item in evaluations for entry in item.trace),
        )


@dataclass(frozen=True)
class Or(Expression):
    expressions: tuple[Expression, ...]

    def __init__(self, expressions: Sequence[Expression]) -> None:
        object.__setattr__(self, "expressions", tuple(expressions))

    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        evaluations = tuple(
            expression.evaluate(engine, process_memory, context)
            for expression in self.expressions
        )
        return Evaluation(
            result=_combine_or(item.result for item in evaluations),
            trace=tuple(entry for item in evaluations for entry in item.trace),
        )


@dataclass(frozen=True)
class ForEach(Expression):
    """IR structure over an already expanded expression sequence.

    This version does not expand domain collections. Collection expansion must
    occur outside the Engine before the sequence is evaluated.
    """

    expressions: tuple[Expression, ...]

    def __init__(self, expressions: Sequence[Expression]) -> None:
        object.__setattr__(self, "expressions", tuple(expressions))

    def evaluate(
        self,
        engine: Engine,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        return All(self.expressions).evaluate(engine, process_memory, context)


def _combine_all(results: Iterable[EngineResult]) -> EngineResult:
    values = tuple(results)
    if EngineResult.NOT_APPLICABLE in values:
        raise CompositionContractError(
            "NOT_APPLICABLE belongs to Criterion applicability, not ALL operands"
        )
    if EngineResult.FALSE in values:
        return EngineResult.FALSE
    # Kept in one helper because this precedence is subject to pilot validation.
    if EngineResult.MANUAL_REVIEW in values:
        return EngineResult.MANUAL_REVIEW
    if EngineResult.UNKNOWN in values:
        return EngineResult.UNKNOWN
    return EngineResult.TRUE


def _combine_or(results: Iterable[EngineResult]) -> EngineResult:
    values = tuple(results)
    if EngineResult.NOT_APPLICABLE in values:
        raise CompositionContractError(
            "NOT_APPLICABLE belongs to Criterion applicability, not OR operands"
        )
    if EngineResult.TRUE in values:
        return EngineResult.TRUE
    # Kept in one helper because this precedence is subject to pilot validation.
    if EngineResult.MANUAL_REVIEW in values:
        return EngineResult.MANUAL_REVIEW
    if EngineResult.UNKNOWN in values:
        return EngineResult.UNKNOWN
    return EngineResult.FALSE


def _references_in(value: Any) -> Iterable[TypedReference]:
    if isinstance(value, TypedReference):
        yield value
    elif isinstance(value, Mapping):
        for item in value.values():
            yield from _references_in(item)
    elif isinstance(value, (list, tuple, frozenset)):
        for item in value:
            yield from _references_in(item)


class Engine:
    """Generic evaluator for Criterion IR and registered predicates."""

    def __init__(self, registry: PredicateRegistry) -> None:
        self.registry = registry

    def evaluate_predicate(
        self,
        predicate_id: str,
        arguments: Mapping[str, Any],
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        return PredicateCall(predicate_id, arguments).evaluate(
            self, process_memory, context
        )

    def evaluate_expression(
        self,
        expression: Expression,
        process_memory: ProcessMemory,
        context: ResolverContext,
    ) -> Evaluation:
        return expression.evaluate(self, process_memory, context)

    def evaluate_criterion(
        self,
        criterion: CriterionIR,
        process_memory: ProcessMemory,
    ) -> CriterionEvaluation:
        context = ResolverContext(
            criterion_id=criterion.criterion_id,
            requirement_id=criterion.requirement_id,
        )
        traces: list[TraceEntry] = []

        if criterion.applicability is not None:
            applicability = criterion.applicability.evaluate(
                self, process_memory, context
            )
            traces.extend(applicability.trace)
            if applicability.result is not EngineResult.TRUE:
                result = (
                    EngineResult.NOT_APPLICABLE
                    if applicability.result
                    in (
                        EngineResult.FALSE,
                        EngineResult.NOT_APPLICABLE,
                    )
                    else applicability.result
                )
                return CriterionEvaluation(
                    criterion_id=criterion.criterion_id,
                    requirement_id=criterion.requirement_id,
                    result=result,
                    traceability=criterion.traceability,
                    trace=tuple(traces),
                )

        evaluation = criterion.expression.evaluate(self, process_memory, context)
        traces.extend(evaluation.trace)
        return CriterionEvaluation(
            criterion_id=criterion.criterion_id,
            requirement_id=criterion.requirement_id,
            result=evaluation.result,
            traceability=criterion.traceability,
            trace=tuple(traces),
        )


__all__ = [
    "All",
    "ArgumentKind",
    "ArgumentSchema",
    "ArgumentSpec",
    "ArgumentContractError",
    "CompositionContractError",
    "CriterionEvaluation",
    "CriterionIR",
    "DomainPredicateResolver",
    "Engine",
    "EngineContractError",
    "EngineResult",
    "Evaluation",
    "Exists",
    "ForEach",
    "ImmutableProcessMemory",
    "Or",
    "PredicateCall",
    "PredicateContract",
    "PredicateNotFoundError",
    "PredicateRegistry",
    "ProcessMemory",
    "ResolverContext",
    "ResultContractError",
    "TraceEntry",
    "Traceability",
    "TypedReference",
]
