class FleetPulseError(Exception):
    """Base exception for FleetPulse"""

    pass


class VehicleNotFoundError(FleetPulseError):
    """Vehicle not found in database"""

    pass


class AlertNotFoundError(FleetPulseError):
    """Alert not found in database"""

    pass


class CacheError(FleetPulseError):
    """Redis cache error"""

    pass


class ModelLoadError(FleetPulseError):
    """ML model loading error"""

    pass
