"""Garante que o workflow executa os quatro portões antes de publicar."""

from pathlib import Path
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]


class TestPublicacao(unittest.TestCase):
    def test_portoes_no_workflow(self):
        workflow = yaml.safe_load((ROOT / ".github/workflows/publicar.yml").read_text(encoding="utf-8"))
        comandos = "\n".join(p.get("run", "") for p in workflow["jobs"]["build"]["steps"])
        for portao in ("python -m unittest discover -s tests", 'node --test "tests/js/*.test.mjs"',
                       "python scripts/validate_odas.py", "mkdocs build --strict"):
            self.assertIn(portao, comandos)


if __name__ == "__main__":
    unittest.main()
