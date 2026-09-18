#!/usr/bin/env bash
# =============================================================================
# Rejoue les migrations puis la suite de tests RLS sur une base PostgreSQL nue.
#
#   ./supabase/tests/run.sh                       # utilise $DATABASE_URL
#   DATABASE_URL=postgres://… ./supabase/tests/run.sh
#
# Objectif : vérifier le cloisonnement entre les 3 rôles sans dépendre d'un
# projet Supabase distant.
# =============================================================================
set -euo pipefail

DB_URL="${DATABASE_URL:-postgres://postgres@localhost/english_course_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run() {
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"
}

echo "▸ Objets Supabase simulés"
run "$ROOT/supabase/tests/00_stub_supabase.sql"

echo "▸ Migrations"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "  · $(basename "$migration")"
  run "$migration"
done

echo "▸ Jeu de données"
run "$ROOT/supabase/tests/01_fixtures.sql"

echo "▸ Tests RLS"
run "$ROOT/supabase/tests/02_rls.sql"

echo "✓ Toutes les assertions passent"
