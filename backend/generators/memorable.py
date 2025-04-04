
import random

WORDS = [
    "happy", "moon", "tree", "river", "fire", "light", "cloud", "dream",
    "storm", "wind", "sun", "star", "stone", "ghost", "leaf", "sky", "wave", "bird",
    "mountain", "ocean", "forest", "rain", "smile", "spark", "shadow", "flower",
    "glow", "mist", "echo", "flame", "breeze", "whisper", "planet", "comet",
    "ice", "snow", "field", "hill", "path", "wolf", "fox", "owl", "bear", "eagle",
    "magic", "mirror", "time", "dreamer", "heart", "soul", "peace", "hope"
]

def generate_memorable_password(num_words: int = 3, separator: str = "-") -> str:
    if num_words < 1:
        raise ValueError("Number of words must be at least 1.")
    
    selected_words = random.sample(WORDS, num_words)
    return separator.join(selected_words)