import random
import string

def generate_secure_password(length: int, uppercase: bool, numbers: bool, symbols: bool) -> str:
    characters = string.ascii_lowercase
    if uppercase:
        characters += string.ascii_uppercase
    if numbers:
        characters += string.digits
    if symbols:
        characters += "!@#$%^&*()"

    if not characters:
        raise ValueError("No character types selected.")

    return ''.join(random.choice(characters) for _ in range(length))