"""
class_info.py
=============
Disease class information, descriptions, cancer status, and precautions
for all 7 HAM10000 dataset classes.
"""

# Mapping: abbreviated label → full info
CLASS_INFO = {
    "mel": {
        "label": "mel",
        "name": "Melanoma",
        "full_name": "Melanoma (Malignant Melanocytic Lesion)",
        "is_cancer": True,
        "description": (
            "Melanoma is the most dangerous form of skin cancer. It develops from "
            "melanocytes (pigment-producing cells) and can spread to other organs if "
            "not treated early. Early detection is critical for survival."
        ),
        "precautions": [
            "Consult a dermatologist or oncologist immediately.",
            "Do not expose the lesion to direct sunlight.",
            "Avoid self-medicating or applying home remedies.",
            "Document the lesion's size and appearance for follow-up.",
            "Surgical excision is typically required — schedule a biopsy.",
        ],
        "color": "#e74c3c",
    },
    "nv": {
        "label": "nv",
        "name": "Melanocytic Nevi",
        "full_name": "Melanocytic Nevi (Common Mole)",
        "is_cancer": False,
        "description": (
            "Melanocytic nevi, commonly known as moles, are benign growths of melanocytes. "
            "They are usually harmless but should be monitored for any changes in size, "
            "color, or shape (ABCDE rule)."
        ),
        "precautions": [
            "Monitor the mole monthly using the ABCDE rule (Asymmetry, Border, Color, Diameter, Evolution).",
            "Use sunscreen (SPF 30+) when outdoors.",
            "Schedule annual skin checks with a dermatologist.",
            "Seek medical advice if the mole changes rapidly.",
        ],
        "color": "#27ae60",
    },
    "bcc": {
        "label": "bcc",
        "name": "Basal Cell Carcinoma",
        "full_name": "Basal Cell Carcinoma (BCC)",
        "is_cancer": True,
        "description": (
            "Basal Cell Carcinoma is the most common type of skin cancer. It grows slowly "
            "and rarely spreads to other parts of the body, but it can cause significant "
            "local tissue damage if left untreated."
        ),
        "precautions": [
            "Seek immediate dermatologist consultation.",
            "Avoid prolonged sun exposure; wear protective clothing.",
            "Apply broad-spectrum sunscreen daily.",
            "Treatment options include surgical removal, radiation, or topical therapies.",
            "Regular follow-ups are essential after treatment.",
        ],
        "color": "#e67e22",
    },
    "bkl": {
        "label": "bkl",
        "name": "Benign Keratosis",
        "full_name": "Benign Keratosis-like Lesions (Solar Lentigo / Seborrheic Keratosis / Lichen Planus-like)",
        "is_cancer": False,
        "description": (
            "Benign keratosis includes a group of non-cancerous skin growths such as seborrheic "
            "keratosis and solar lentigo. They are very common in older adults and are generally "
            "harmless, though they can resemble malignant lesions."
        ),
        "precautions": [
            "No immediate treatment is usually required.",
            "Avoid scratching or irritating the lesion.",
            "Consult a dermatologist to confirm the benign nature.",
            "Use moisturizers to manage any associated dryness.",
            "Annual skin checks are recommended.",
        ],
        "color": "#3498db",
    },
    "df": {
        "label": "df",
        "name": "Dermatofibroma",
        "full_name": "Dermatofibroma (Benign Fibrous Skin Nodule)",
        "is_cancer": False,
        "description": (
            "Dermatofibromas are benign skin nodules commonly found on the legs. They are "
            "firm, dome-shaped bumps that may feel tender. They are generally harmless and "
            "do not require treatment unless symptomatic."
        ),
        "precautions": [
            "No treatment necessary unless causing discomfort.",
            "Avoid picking or squeezing the nodule.",
            "Consult a dermatologist if the lesion grows rapidly.",
            "Simple excision is available if removal is desired for cosmetic reasons.",
        ],
        "color": "#9b59b6",
    },
    "vasc": {
        "label": "vasc",
        "name": "Vascular Lesions",
        "full_name": "Vascular Lesions (Angiomas, Angiokeratomas, Pyogenic Granulomas)",
        "is_cancer": False,
        "description": (
            "Vascular lesions are abnormal clusters of blood vessels near the skin surface. "
            "They include cherry angiomas, angiokeratomas, and pyogenic granulomas. Most are "
            "benign, but some (like pyogenic granulomas) may bleed easily."
        ),
        "precautions": [
            "Avoid trauma to the affected area to prevent bleeding.",
            "Consult a dermatologist for proper diagnosis.",
            "Laser therapy or minor surgical excision is available for cosmetic removal.",
            "Monitor for rapid growth or changes.",
        ],
        "color": "#1abc9c",
    },
    "akiec": {
        "label": "akiec",
        "name": "Actinic Keratoses",
        "full_name": "Actinic Keratoses & Intraepithelial Carcinoma (Pre-cancerous)",
        "is_cancer": True,
        "description": (
            "Actinic Keratosis (AK) is a pre-cancerous, rough, scaly patch on the skin caused "
            "by years of UV exposure. If left untreated, AK can progress into Squamous Cell "
            "Carcinoma. Early treatment is strongly recommended."
        ),
        "precautions": [
            "Consult a dermatologist promptly for treatment.",
            "Apply sunscreen (SPF 50+) daily and avoid peak sun hours.",
            "Treatment options: cryotherapy, topical creams (5-FU, imiquimod), or photodynamic therapy.",
            "Avoid tanning beds and prolonged UV exposure.",
            "Regular monitoring and follow-up every 6 months.",
        ],
        "color": "#e74c3c",
    },
}

# Ordered class labels (must match model output index)
CLASS_LABELS = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]

def get_class_info(label: str) -> dict:
    """Return disease info dict for a given label."""
    return CLASS_INFO.get(label, {})

def get_ordered_labels() -> list:
    """Return class labels in model output order."""
    return CLASS_LABELS
