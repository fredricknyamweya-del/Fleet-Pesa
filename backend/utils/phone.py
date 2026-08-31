import re


def normalize_kenyan_phone(value):
    """
    Normalize Kenyan mobile numbers to 07XXXXXXXX.


    Stored/returned:
        0712345678
    """

    if value is None:
        raise ValueError("Phone number is required.")

    phone = str(value).strip()

    # Remove spaces, dashes and brackets
    phone = re.sub(r"[\s\-()]", "", phone)

    # Convert +254712345678 -> 0712345678
    if phone.startswith("+254"):
        phone = "0" + phone[4:]

    # Convert 254712345678 -> 0712345678
    elif phone.startswith("254"):
        phone = "0" + phone[3:]

    # Validate Kenyan mobile number
    if not re.fullmatch(r"07\d{8}", phone):
        raise ValueError(
            "Enter a valid Kenyan phone number, e.g. 0712345678"
        )

    return phone
