import re


def normalize_kenyan_phone(value):
    """
    Validate and normalize Kenyan mobile numbers.

    Accepted formats:
        0712345678
        0112345678

    Stored/returned exactly as:
        0712345678
        0112345678
    """

    if value is None:
        raise ValueError("Phone number is required.")

    phone = str(value).strip()

    # Remove spaces, dashes and brackets
    phone = re.sub(r"[\s\-()]", "", phone)

    # Validate Kenyan mobile number.
    # Must start with 01 or 07 and contain exactly 10 digits.
    if not re.fullmatch(r"0[17]\d{8}", phone):
        raise ValueError("Enter a valid Kenyan phone number, e.g. 0712345678 or 0112345678")

    return phone
