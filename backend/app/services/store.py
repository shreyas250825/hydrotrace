from uuid import uuid4

_STORE: dict[str, dict] = {}


def save_result(payload: dict) -> str:
    sim_id = str(uuid4())
    _STORE[sim_id] = payload
    return sim_id


def get_result(sim_id: str) -> dict | None:
    return _STORE.get(sim_id)
