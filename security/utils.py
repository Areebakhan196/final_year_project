from cryptography.fernet import Fernet
from django.conf import settings
import base64

class DataEncryption:
    def __init__(self):
        self.key = settings.ENCRYPTION_KEY.encode()
        self.cipher_suite = Fernet(self.key)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        return self.cipher_suite.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        if not encrypted_data:
            return ""
        try:
            return self.cipher_suite.decrypt(encrypted_data.encode()).decode()
        except Exception:
            return "Decryption Error"

encryption_tool = DataEncryption()
