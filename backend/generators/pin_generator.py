import random

def generate_pin(length=4, min_length=4, max_length=8):
    if length not in [4, 6, 8]:
        raise ValueError("PIN length must be either 4 or 6 or 8 digits.")
    return ''.join(str(random.randint(0, 9)) for _ in range(length))