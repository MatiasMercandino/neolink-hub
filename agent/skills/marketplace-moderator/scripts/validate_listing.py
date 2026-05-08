#!/usr/bin/env python3
"""
validate_listing.py
-------------------
Marketplace Moderator — NEOLINK HUB
Validates a digital product listing against NEOLINK HUB's marketplace policies.

Usage:
    python scripts/validate_listing.py '<listing_json>'

Exit codes:
    0 — Listing is VALID and ready to publish.
    1 — Listing is INVALID. Check stderr for detailed error messages.
"""

import json
import re
import sys
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Configuration & Constants
# ---------------------------------------------------------------------------

ALLOWED_CATEGORIES = {
    "artificial-intelligence",
    "automation",
    "cloud-infrastructure",
    "collaboration-tools",
    "cybersecurity",
    "data-intelligence",
    "developer-tools",
    "ecommerce",
    "erp-crm",
    "fintech",
    "hr-tech",
    "legal-tech",
    "logistics-supply-chain",
    "marketing-analytics",
    "productivity",
    "vertical-saas",
}

ALLOWED_BILLING_CYCLES = {"monthly", "annual", "one-time", "usage-based"}

ALLOWED_CURRENCIES = {
    "USD", "EUR", "GBP", "COP", "MXN", "BRL", "ARS", "CLP", "PEN", "UYU",
}

# Spam/clickbait heuristics
SPAM_PATTERNS = [
    r"[!]{2,}",                        # Two or more consecutive exclamation marks
    r"[$€£]{2,}",                       # Repeated currency symbols
    r"\b(gratis|free|gana|win|earn)\b.{0,30}(fácil|easy|guaranteed|garantizado)\b",
    r"\b\d{3,}%",                       # Percentages >= 100% (e.g., "1000%")
    r"(.)\1{3,}",                       # Any character repeated 4+ times consecutively
    r"\b(mejor del mundo|número uno|#1 en el mundo)\b",
]

COMPILED_SPAM = [re.compile(p, re.IGNORECASE) for p in SPAM_PATTERNS]

UNVERIFIABLE_CLAIMS = [
    r"\b(garantizado al? \d+%|results? guaranteed|100% efectivo|sin esfuerzo|automáticamente)\b",
    r"\b(compra ya|buy now|actúa ahora|act now|oferta limitada|limited offer)\b",
]
COMPILED_CLAIMS = [re.compile(p, re.IGNORECASE) for p in UNVERIFIABLE_CLAIMS]

TITLE_MIN_LEN = 10
TITLE_MAX_LEN = 100
DESCRIPTION_MIN_LEN = 100
TAG_MAX_COUNT = 10
TAG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$")


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------

@dataclass
class ValidationResult:
    errors: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def add_error(self, message: str) -> None:
        self.errors.append(message)


def _check_spam(text: str, field_name: str, result: ValidationResult) -> None:
    """Detect spam and clickbait patterns in a text field."""
    for pattern in COMPILED_SPAM:
        if pattern.search(text):
            result.add_error(
                f"'{field_name}' contiene contenido de spam o clickbait "
                f"(patrón detectado: '{pattern.pattern}')."
            )
            return  # One error per field is enough


def _check_unverifiable_claims(text: str, field_name: str, result: ValidationResult) -> None:
    """Detect unverifiable or high-pressure sales claims."""
    for pattern in COMPILED_CLAIMS:
        if pattern.search(text):
            result.add_error(
                f"'{field_name}' contiene afirmaciones no verificables o lenguaje de alta presión."
            )
            return


def validate_title(title: Any, result: ValidationResult) -> None:
    if not isinstance(title, str) or not title.strip():
        result.add_error("'title' es requerido y debe ser una cadena de texto no vacía.")
        return

    title = title.strip()
    if len(title) < TITLE_MIN_LEN:
        result.add_error(
            f"'title' es demasiado corto ({len(title)} chars). Mínimo: {TITLE_MIN_LEN} caracteres."
        )
    if len(title) > TITLE_MAX_LEN:
        result.add_error(
            f"'title' es demasiado largo ({len(title)} chars). Máximo: {TITLE_MAX_LEN} caracteres."
        )

    _check_spam(title, "title", result)


def validate_description(description: Any, result: ValidationResult) -> None:
    if not isinstance(description, str) or not description.strip():
        result.add_error("'description' no puede estar vacía.")
        return

    description = description.strip()
    if len(description) < DESCRIPTION_MIN_LEN:
        result.add_error(
            f"'description' es demasiado corta ({len(description)} chars). "
            f"Mínimo: {DESCRIPTION_MIN_LEN} caracteres."
        )

    _check_spam(description, "description", result)
    _check_unverifiable_claims(description, "description", result)


def validate_category(category: Any, result: ValidationResult) -> None:
    if not isinstance(category, str) or not category.strip():
        result.add_error("'category' es requerida y debe ser una cadena de texto.")
        return

    if category.strip().lower() not in ALLOWED_CATEGORIES:
        result.add_error(
            f"'category' con valor '{category}' no está en la lista de categorías permitidas. "
            f"Categorías válidas: {sorted(ALLOWED_CATEGORIES)}."
        )


def validate_price(price: Any, is_free: bool, result: ValidationResult) -> None:
    if price is None:
        result.add_error("'price' es requerido.")
        return

    if not isinstance(price, (int, float)):
        result.add_error("'price' debe ser un valor numérico.")
        return

    if price < 0:
        result.add_error("'price' no puede ser negativo.")
        return

    if price == 0 and not is_free:
        result.add_error(
            "'price' debe ser mayor a 0 o el campo 'is_free' debe ser true."
        )


def validate_currency(currency: Any, result: ValidationResult) -> None:
    if not isinstance(currency, str) or not currency.strip():
        result.add_error("'currency' es requerida y debe ser un código ISO 4217.")
        return

    if currency.strip().upper() not in ALLOWED_CURRENCIES:
        result.add_error(
            f"'currency' con valor '{currency}' no es un código ISO 4217 soportado. "
            f"Valores válidos: {sorted(ALLOWED_CURRENCIES)}."
        )


def validate_billing_cycle(billing_cycle: Any, result: ValidationResult) -> None:
    if not isinstance(billing_cycle, str) or not billing_cycle.strip():
        result.add_error(
            f"'billing_cycle' es requerido. Valores válidos: {sorted(ALLOWED_BILLING_CYCLES)}."
        )
        return

    if billing_cycle.strip().lower() not in ALLOWED_BILLING_CYCLES:
        result.add_error(
            f"'billing_cycle' con valor '{billing_cycle}' no es válido. "
            f"Valores aceptados: {sorted(ALLOWED_BILLING_CYCLES)}."
        )


def validate_vendor_id(vendor_id: Any, result: ValidationResult) -> None:
    if not isinstance(vendor_id, str) or not vendor_id.strip():
        result.add_error("'vendor_id' es requerido y no puede estar vacío.")


def validate_tags(tags: Any, result: ValidationResult) -> None:
    if tags is None:
        return  # Optional field

    if not isinstance(tags, list):
        result.add_error("'tags' debe ser un array.")
        return

    if len(tags) > TAG_MAX_COUNT:
        result.add_error(f"'tags' excede el máximo permitido de {TAG_MAX_COUNT} etiquetas.")

    for i, tag in enumerate(tags):
        if not isinstance(tag, str):
            result.add_error(f"'tags[{i}]' debe ser una cadena de texto.")
            continue
        if not TAG_PATTERN.match(tag):
            result.add_error(
                f"'tags[{i}]' con valor '{tag}' es inválido. "
                "Solo se permiten minúsculas, números y guiones (sin guión al inicio/fin)."
            )


def validate_listing(listing: dict) -> ValidationResult:
    """Run all validators against the listing and aggregate errors."""
    result = ValidationResult()
    is_free = listing.get("is_free", False)

    validate_title(listing.get("title"), result)
    validate_description(listing.get("description"), result)
    validate_category(listing.get("category"), result)
    validate_price(listing.get("price"), is_free=bool(is_free), result=result)
    validate_currency(listing.get("currency"), result)
    validate_billing_cycle(listing.get("billing_cycle"), result)
    validate_vendor_id(listing.get("vendor_id"), result)
    validate_tags(listing.get("tags"), result)

    return result


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    if len(sys.argv) < 2:
        print(
            "USAGE_ERROR: Se requiere un argumento con el JSON del listado.\n"
            "  Ejemplo: python scripts/validate_listing.py '<listing_json>'",
            file=sys.stderr,
        )
        return 1

    raw_input = sys.argv[1]

    # --- Parse JSON ---
    try:
        listing = json.loads(raw_input)
    except json.JSONDecodeError as exc:
        print(
            f"PARSE_ERROR: El argumento no es un JSON válido. Detalle: {exc}",
            file=sys.stderr,
        )
        return 1

    if not isinstance(listing, dict):
        print(
            "PARSE_ERROR: El JSON debe ser un objeto (dict), no un array u otro tipo.",
            file=sys.stderr,
        )
        return 1

    # --- Run validation ---
    result = validate_listing(listing)

    if result.is_valid:
        vendor_id = listing.get("vendor_id", "unknown")
        title = listing.get("title", "")
        print(f"APPROVED: El listado '{title}' del vendor '{vendor_id}' es válido y puede ser publicado.")
        return 0
    else:
        error_summary = " | ".join(result.errors)
        print(
            f"VALIDATION_ERROR: {error_summary}",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
