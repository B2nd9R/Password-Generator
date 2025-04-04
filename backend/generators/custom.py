import random

def generate_custom_password(characters: str, length: int) -> str:
    if not characters:
        raise ValueError("Character set cannot be empty.")
    
    return ''.join(random.choice(characters) for _ in range(length))