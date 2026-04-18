import os


def send_whatsapp(phone: str, message: str) -> bool:
    """Send WhatsApp alert via Twilio sandbox."""
    try:
        from twilio.rest import Client
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
        if not account_sid or not auth_token:
            print("[Twilio] Credentials not set")
            return False

        client = Client(account_sid, auth_token)
        normalized = phone.strip()
        if not normalized.startswith('+'):
            normalized = f'+91{normalized}'

        client.messages.create(
            body=message,
            from_='whatsapp:+14155238886',
            to=f'whatsapp:{normalized}'
        )
        print(f"[Twilio] WhatsApp sent to {normalized}")
        return True
    except Exception as e:
        print(f"[Twilio] Error: {e}")
        return False


def send_sms(phone: str, message: str) -> bool:
    """Send SMS via Twilio."""
    try:
        from twilio.rest import Client
        client = Client(
            os.environ.get('TWILIO_ACCOUNT_SID'),
            os.environ.get('TWILIO_AUTH_TOKEN')
        )
        normalized = phone.strip()
        if not normalized.startswith('+'):
            normalized = f'+91{normalized}'
        client.messages.create(
            body=message,
            from_='+15005550006',
            to=normalized
        )
        print(f"[Twilio] SMS sent to {normalized}")
        return True
    except Exception as e:
        print(f"[Twilio] SMS error: {e}")
        return False