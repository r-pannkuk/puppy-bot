"""
pytest configuration for Python script tests.

Adds src/scripts/ to sys.path and sets the working directory to the project
root so that the relative asset paths used by the scripts resolve correctly.
"""
import os
import sys

_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_scripts_dir = os.path.join(_project_root, "src", "scripts")

if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

# Scripts resolve assets via paths like './src/assets/media/...' relative to CWD
os.chdir(_project_root)
