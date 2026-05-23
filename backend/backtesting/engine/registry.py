from typing import Type

from .base import Strategy


_REGISTRY: dict[str, Type[Strategy]] = {}


def register(cls: Type[Strategy]) -> Type[Strategy]:
    """Decorator: register a Strategy subclass by its `slug`."""
    if not getattr(cls, "slug", ""):
        raise ValueError(f"{cls.__name__} is missing `slug`")
    if cls.slug in _REGISTRY and _REGISTRY[cls.slug] is not cls:
        raise ValueError(f"Duplicate strategy slug: {cls.slug}")
    _REGISTRY[cls.slug] = cls
    return cls


def get_strategy(slug: str) -> Type[Strategy]:
    _load_strategies()
    if slug not in _REGISTRY:
        raise KeyError(f"Unknown strategy: {slug}")
    return _REGISTRY[slug]


def all_strategies() -> list[dict]:
    """Schema list for the /api/backtesting/strategies/ endpoint."""
    _load_strategies()
    return [cls.schema() for cls in _REGISTRY.values()]


def all_slugs() -> set[str]:
    _load_strategies()
    return set(_REGISTRY.keys())


_loaded = False


def _load_strategies() -> None:
    global _loaded
    if _loaded:
        return
    _loaded = True
    from . import strategies  # noqa: F401  -- import triggers @register side effects
