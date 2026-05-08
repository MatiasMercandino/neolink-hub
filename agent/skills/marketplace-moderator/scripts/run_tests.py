#!/usr/bin/env python3
"""
run_tests.py
------------
Suite de pruebas para validate_listing.py
Ejecuta los 4 casos del few-shot learning definidos en SKILL.md y reporta resultados.
"""

import sys
import json
from validate_listing import validate_listing

GREEN = "\033[92m"
RED   = "\033[91m"
RESET = "\033[0m"
BOLD  = "\033[1m"

TESTS = [
    {
        "id": 1,
        "label": "VÁLIDO — API SaaS bien definida",
        "expect_valid": True,
        "listing": {
            "title": "API de Análisis de Sentimientos v2.0",
            "description": (
                "API REST que procesa texto en tiempo real para detectar polaridad emocional "
                "(positivo, negativo, neutro) con un 94% de precisión. Incluye SDK para Node.js "
                "y Python, documentación OpenAPI 3.0, SLA del 99.9% y soporte técnico dedicado. "
                "Ideal para equipos de CX y marketing B2B."
            ),
            "category": "artificial-intelligence",
            "price": 299.00,
            "currency": "USD",
            "billing_cycle": "monthly",
            "vendor_id": "vendor_8f3a2c",
            "tags": ["nlp", "api", "saas", "sentiment-analysis"],
        },
    },
    {
        "id": 2,
        "label": "INVÁLIDO — Precio en cero y descripción vacía",
        "expect_valid": False,
        "listing": {
            "title": "Plugin de Facturación Electrónica",
            "description": "",
            "category": "fintech",
            "price": 0,
            "currency": "USD",
            "billing_cycle": "monthly",
            "vendor_id": "vendor_1a9b4d",
        },
    },
    {
        "id": 3,
        "label": "INVÁLIDO — Categoría no permitida y título con spam",
        "expect_valid": False,
        "listing": {
            "title": "GANA DINERO FACIL!!! El mejor software del mundo",
            "description": (
                "Software que te hace ganar dinero de forma automatica sin esfuerzo. "
                "Resultados garantizados al 1000%. Compra ya ahora mismo sin pensarlo."
            ),
            "category": "get-rich-quick",
            "price": 49.99,
            "currency": "USD",
            "billing_cycle": "one-time",
            "vendor_id": "vendor_zz9921",
        },
    },
    {
        "id": 4,
        "label": "VÁLIDO — Dataset LATAM con pago único",
        "expect_valid": True,
        "listing": {
            "title": "Dataset de Empresas LATAM — Q1 2026",
            "description": (
                "Conjunto de datos estructurado con 50.000 registros de empresas de América Latina. "
                "Incluye razón social, sector industrial (NAICS), ingresos anuales estimados, "
                "tamaño de empleados y país. Formato CSV y Parquet. Actualización trimestral "
                "garantizada por contrato SLA. Ideal para equipos de ventas B2B e inteligencia de mercado."
            ),
            "category": "data-intelligence",
            "price": 1200.00,
            "currency": "USD",
            "billing_cycle": "one-time",
            "is_free": False,
            "vendor_id": "vendor_c77e01",
            "tags": ["dataset", "latam", "b2b", "market-intelligence"],
        },
    },
]


def run_tests():
    passed = 0
    failed = 0

    print(f"\n{BOLD}{'='*60}")
    print("  NEOLINK HUB — Marketplace Moderator: Test Suite")
    print(f"{'='*60}{RESET}\n")

    for test in TESTS:
        result = validate_listing(test["listing"])
        is_valid = result.is_valid
        expected = test["expect_valid"]
        ok = is_valid == expected

        status = f"{GREEN}PASS{RESET}" if ok else f"{RED}FAIL{RESET}"
        verdict = "APPROVED" if is_valid else f"REJECTED"
        print(f"  [{status}] Test {test['id']}: {test['label']}")
        print(f"         Resultado: {verdict}")

        if not is_valid:
            for err in result.errors:
                print(f"         ⚠  {err}")

        if not ok:
            print(f"         {RED}✗ Se esperaba {'VALID' if expected else 'INVALID'} pero fue {'VALID' if is_valid else 'INVALID'}{RESET}")
            failed += 1
        else:
            passed += 1

        print()

    print(f"{BOLD}{'='*60}")
    print(f"  Resultado final: {GREEN}{passed} pasados{RESET} / {RED}{failed} fallados{RESET}")
    print(f"{'='*60}{RESET}\n")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())
