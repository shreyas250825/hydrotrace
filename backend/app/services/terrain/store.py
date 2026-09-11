"""In-memory per-dam terrain registry (upload association)."""

from __future__ import annotations

from threading import RLock

from app.services.terrain.models import DamTerrainPackage

_lock = RLock()
_packages: dict[str, DamTerrainPackage] = {}


def get_package(dam_id: str) -> DamTerrainPackage | None:
    with _lock:
        return _packages.get(dam_id)


def set_package(dam_id: str, package: DamTerrainPackage) -> None:
    with _lock:
        _packages[dam_id] = package


def clear_package(dam_id: str) -> bool:
    with _lock:
        return _packages.pop(dam_id, None) is not None


def list_real_dam_ids() -> list[str]:
    with _lock:
        return [
            dam_id
            for dam_id, pkg in _packages.items()
            if pkg.metadata.terrain_type == "REAL"
        ]
