#!/usr/bin/env bash
# =============================================================================
# test_api_flow.sh
# NEOLINK HUB — MVP API Integration Test Suite
# =============================================================================
# Valida el flujo completo del endpoint POST /api/v1/opportunities contra
# un servidor corriendo en localhost:3001.
#
# Uso:
#   chmod +x test_api_flow.sh
#   ./test_api_flow.sh
#
# Requisitos:
#   - El servidor debe estar corriendo: npm run dev (en services/opportunities/)
#   - curl disponible en el sistema
#   - python3 disponible (para formatear JSON)
# =============================================================================

set -euo pipefail

BASE_URL="${API_BASE_URL:-http://localhost:3001}"
PASS=0
FAIL=0

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN="\033[92m"
RED="\033[91m"
YELLOW="\033[93m"
BOLD="\033[1m"
RESET="\033[0m"

# ── Helpers ───────────────────────────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}  NEOLINK HUB — API Integration Test Suite${RESET}"
  echo -e "${BOLD}  Target: ${BASE_URL}${RESET}"
  echo -e "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  echo ""
}

run_test() {
  local test_id="$1"
  local description="$2"
  local expected_status="$3"
  local expected_code="$4"
  local method="$5"
  local endpoint="$6"
  local body="${7:-}"

  echo -e "  ${BOLD}Test ${test_id}:${RESET} ${description}"

  # Build curl args
  local curl_args=(-s -o /tmp/neolink_response.json -w "%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    "${BASE_URL}${endpoint}")

  if [[ -n "$body" ]]; then
    curl_args+=(-d "$body")
  fi

  local http_code
  http_code=$(curl "${curl_args[@]}" 2>/dev/null || echo "000")

  local response
  response=$(cat /tmp/neolink_response.json 2>/dev/null || echo "{}")

  local actual_code
  actual_code=$(echo "$response" | python3 -c \
    "import json,sys; d=json.load(sys.stdin); print(d.get('code', d.get('status','')))" \
    2>/dev/null || echo "parse_error")

  # Evaluate
  if [[ "$http_code" == "$expected_status" ]] && \
     [[ "$actual_code" == "$expected_code" || "$expected_code" == "*" ]]; then
    echo -e "  ${GREEN}[PASS]${RESET} HTTP $http_code · code: $actual_code"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}[FAIL]${RESET} Esperado HTTP $expected_status / code '$expected_code'"
    echo -e "         Obtenido HTTP $http_code / code '$actual_code'"
    echo -e "         Response: $(echo "$response" | python3 -m json.tool 2>/dev/null | head -8)"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

print_summary() {
  echo -e "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  if [[ $FAIL -eq 0 ]]; then
    echo -e "  ${GREEN}${BOLD}✅ Todos los tests pasaron: ${PASS}/${PASS}${RESET}"
  else
    echo -e "  ${RED}${BOLD}❌ Fallaron: ${FAIL} | Pasaron: ${PASS}${RESET}"
  fi
  echo -e "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  echo ""
  [[ $FAIL -eq 0 ]] && exit 0 || exit 1
}

# =============================================================================
# TEST SUITE
# =============================================================================

print_header

# ── Test 1: Health Check ──────────────────────────────────────────────────────
run_test 1 "GET /health → 200 OK" \
  "200" "ok" \
  "GET" "/health"

# ── Test 2: Listado válido → 201 Created ─────────────────────────────────────
VALID_BODY=$(cat <<'JSON'
{
  "title": "API de Analisis de Sentimientos v2.0",
  "description": "API REST que procesa texto en tiempo real para detectar polaridad emocional con alta precision. Incluye SDK para Node.js y Python con documentacion OpenAPI 3.0 y SLA del 99.9 por ciento.",
  "category": "artificial-intelligence",
  "price": 299,
  "currency": "USD",
  "billing_cycle": "monthly",
  "vendor_id": "vendor_test_001",
  "tags": ["nlp", "api", "saas"]
}
JSON
)

run_test 2 "POST /api/v1/opportunities — Listado válido → 201 Created" \
  "201" "success" \
  "POST" "/api/v1/opportunities" "$VALID_BODY"

# ── Test 3: Moderación fallida → 400 MODERATION_FAILED ───────────────────────
INVALID_MODERATION=$(cat <<'JSON'
{
  "title": "GANA DINERO FACIL!!!",
  "description": "corta",
  "category": "get-rich-quick",
  "price": 0,
  "currency": "USD",
  "billing_cycle": "monthly",
  "vendor_id": "vendor_test_002"
}
JSON
)

run_test 3 "POST /api/v1/opportunities — Spam + inválido → 400 MODERATION_FAILED" \
  "400" "MODERATION_FAILED" \
  "POST" "/api/v1/opportunities" "$INVALID_MODERATION"

# ── Test 4: Campos faltantes → 400 MISSING_REQUIRED_FIELDS ───────────────────
MISSING_FIELDS='{"title": "Solo el titulo"}'

run_test 4 "POST /api/v1/opportunities — Sin campos → 400 MISSING_REQUIRED_FIELDS" \
  "400" "MISSING_REQUIRED_FIELDS" \
  "POST" "/api/v1/opportunities" "$MISSING_FIELDS"

# ── Test 5: Ruta inexistente → 404 NOT_FOUND ─────────────────────────────────
run_test 5 "GET /api/v1/unknown → 404 NOT_FOUND" \
  "404" "NOT_FOUND" \
  "GET" "/api/v1/unknown"

# ── Test 6: Dataset válido (one-time) → 201 Created ──────────────────────────
DATASET_BODY=$(cat <<'JSON'
{
  "title": "Dataset Empresas LATAM 2026",
  "description": "Conjunto de datos con registros de empresas de America Latina. Incluye razon social, sector industrial, ingresos anuales estimados, tamano de equipo y pais de origen. Formatos CSV y Parquet. Actualizacion garantizada cada trimestre por contrato.",
  "category": "data-intelligence",
  "price": 1200,
  "currency": "USD",
  "billing_cycle": "one-time",
  "vendor_id": "vendor_test_003",
  "tags": ["dataset", "latam", "b2b"]
}
JSON
)

run_test 6 "POST /api/v1/opportunities — Dataset one-time → 201 Created" \
  "201" "success" \
  "POST" "/api/v1/opportunities" "$DATASET_BODY"

# =============================================================================
print_summary
