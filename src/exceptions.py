"""Shared pipeline exceptions."""


class InsufficientDataError(Exception):
    """Raised when fewer reviews remain after filtering than required."""

    def __init__(self, count: int, minimum: int) -> None:
        self.count = count
        self.minimum = minimum
        super().__init__(
            f"Insufficient reviews after filtering: got {count}, need at least {minimum}"
        )
