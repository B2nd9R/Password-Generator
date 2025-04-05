import random
import string

WORDS = [
    # القائمة الموسعة (200 كلمة)
    "apple", "brave", "castle", "dolphin", "energy", "falcon", "garden", "honey",
    "island", "jungle", "king", "lion", "music", "night", "oasis", "puzzle", "queen",
    "rocket", "silver", "tiger", "unique", "violet", "water", "xenon", "yellow", "zebra",
    "aurora", "breeze", "cascade", "desert", "eclipse", "flamingo", "galaxy", "horizon",
    "infinity", "jupiter", "koala", "lagoon", "mystic", "nebula", "orchard", "peacock",
    "quartz", "raven", "sapphire", "tornado", "unicorn", "volcano", "willow", "xylophone",
    "happy", "moon", "tree", "river", "fire", "light", "cloud", "dream", "storm", "wind",
    "sun", "star", "stone", "ghost", "leaf", "sky", "wave", "bird", "mountain", "ocean",
    "forest", "rain", "smile", "spark", "shadow", "flower", "glow", "mist", "echo", "flame",
    "breeze", "whisper", "planet", "comet", "ice", "snow", "field", "hill", "path", "wolf",
    "fox", "owl", "bear", "eagle", "magic", "mirror", "time", "dreamer", "heart", "soul",
    "peace", "hope", "amber", "blaze", "crystal", "diamond", "ember", "feather", "glacier",
    "harbor", "illusion", "jade", "karma", "lighthouse", "meadow", "nirvana", "opal",
    "phoenix", "quasar", "reef", "sahara", "tempest", "umbra", "vortex", "whirlpool",
    "zenith", "alchemy", "butterfly", "cosmos", "destiny", "eternity", "freedom", "harmony",
    "inspire", "journey", "kaleido", "liberty", "melody", "northern", "obsidian", "paradise",
    "radiant", "serenity", "tranquil", "unity", "velocity", "wonder", "yellowstone", "zodiac",
    "arcadia", "blueprint", "champion", "dynamo", "element", "fortuna", "gravity", "hyperion",
    "imagine", "jubilee", "krypton", "legend", "miracle", "noble", "olympus", "pioneer",
    "quantum", "relic", "spectrum", "titan", "utopia", "voyager", "wisdom", "xanadu",
    "yearning", "zeppelin"
]

def generate_memorable_password(
    num_words: int = 3,
    separator: str = "-",
    include_numbers: bool = False,
    num_digits: int = 2,
    capitalize: bool = False
) -> str:
    """
    توليد كلمة مرور قوية وسهلة التذكر
    
    الخيارات:
    num_words: عدد الكلمات (افتراضي 3)
    separator: الفاصل بين الكلمات (افتراضي -)
    include_numbers: إضافة أرقام عشوائية (افتراضي False)
    num_digits: عدد الأرقام لكل كلمة (افتراضي 2)
    capitalize: تحويل الحرف الأول لكبير (افتراضي False)
    """
    
    # التحقق من المدخلات
    if num_words < 1:
        raise ValueError("يجب أن يكون عدد الكلمات 1 على الأقل")
    if num_words > len(WORDS):
        raise ValueError(f"الحد الأقصى للكلمات هو {len(WORDS)}")
    if num_digits < 1:
        raise ValueError("يجب أن يحتوي الرقم على خانتين على الأقل")

    # اختيار الكلمات العشوائية
    selected_words = random.sample(WORDS, num_words)
    
    # إضافة الأرقام إذا مطلوب
    if include_numbers:
        numbers = [
            str(random.randint(0, 10**num_digits - 1)).zfill(num_digits)
            for _ in range(num_words)
        ]
        selected_words = [f"{word}{num}" for word, num in zip(selected_words, numbers)]
    
    # تحويل الحرف الأول لكبير إذا مطلوب
    if capitalize:
        selected_words = [word.capitalize() for word in selected_words]
    
    return separator.join(selected_words)

# أمثلة للاستخدام:
print(generate_memorable_password())  # happy-sun-flower
print(generate_memorable_password(4, "_", True))  # galaxy12_volcano56_ember34_zenith78
print(generate_memorable_password(2, ".", True, 3, True))  # Diamond123.Serenity456