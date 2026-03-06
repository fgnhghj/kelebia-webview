"""File upload validators for Kelebia Classroom."""
from django.core.exceptions import ValidationError

# Dangerous file extensions that should never be uploaded
BLOCKED_EXTENSIONS = {
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'vbs', 'vbe',
    'js', 'jse', 'ws', 'wsf', 'wsc', 'wsh', 'ps1', 'ps1xml', 'ps2',
    'ps2xml', 'psc1', 'psc2', 'msh', 'msh1', 'msh2', 'mshxml',
    'sh', 'bash', 'csh', 'ksh', 'reg', 'inf', 'hta', 'cpl',
    'dll', 'sys', 'drv', 'ocx', 'class', 'jar',
}

# Maximum file size: 25MB
MAX_FILE_SIZE = 25 * 1024 * 1024


def validate_upload_file(value):
    """Validate uploaded files: block dangerous extensions and enforce size limit."""
    # Check file size
    if value.size > MAX_FILE_SIZE:
        size_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise ValidationError(f'File too large. Maximum size is {size_mb}MB.')

    # Check extension
    name = value.name.lower()
    ext = name.rsplit('.', 1)[-1] if '.' in name else ''
    if ext in BLOCKED_EXTENSIONS:
        raise ValidationError(f'File type .{ext} is not allowed for security reasons.')

    return value
