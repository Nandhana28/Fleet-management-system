class FleetPulseError(Exception):
    pass

class VehicleNotFoundError(FleetPulseError):
    def __init__(self, vehicle_id: str):
        self.vehicle_id = vehicle_id
        super().__init__(f"Vehicle not found: {vehicle_id}")

class AlertNotFoundError(FleetPulseError):
    def __init__(self, alert_id: str):
        self.alert_id = alert_id
        super().__init__(f"Alert not found: {alert_id}")

class DriverNotFoundError(FleetPulseError):
    def __init__(self, driver_id: str):
        self.driver_id = driver_id
        super().__init__(f"Driver not found: {driver_id}")

class CacheError(FleetPulseError):
    pass

class DatabaseError(FleetPulseError):
    pass

class AgentError(FleetPulseError):
    pass