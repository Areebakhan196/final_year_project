"""
Resolve Django FileField values to browser-safe absolute Cloudinary HTTPS URLs.
"""
import os
import re
from functools import lru_cache
from urllib.parse import unquote

import cloudinary.api
import cloudinary.utils

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.webm', '.m4a', '.ogg', '.opus', '.aac'}
RAW_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.txt', '.zip', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf',
}
FORMAT_ALIASES = {'jpeg': 'jpg', 'jpe': 'jpg'}


def resource_type_for_path(path: str) -> str:
    """Cloudinary delivery/upload type: image, video (audio), or raw (documents)."""
    lower = (path or '').lower().split('?')[0]
    ext = os.path.splitext(lower)[1]
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    if ext in AUDIO_EXTENSIONS:
        return 'video'
    if '/evidence/documents/' in lower or '/documents/' in lower:
        return 'raw'
    if ext in RAW_EXTENSIONS:
        return 'raw'
    if '/audio/' in lower or lower.startswith('complaints/audio'):
        return 'video'
    if '/evidence/images/' in lower or '/images/' in lower:
        return 'image'
    # Legacy evidence on this project is stored as Cloudinary "image" resources.
    if '/evidence/' in lower:
        return 'image'
    return 'image'


def normalize_public_id(stored_name: str) -> str:
    """django-cloudinary-storage uploads under MEDIA_URL prefix (media/)."""
    name = (stored_name or '').strip().replace('\\', '/').lstrip('/')
    if name.startswith('http://') or name.startswith('https://'):
        extracted = _extract_public_id_from_cloudinary_url(name)
        return extracted or name
    if name.startswith('media/'):
        return name
    return f'media/{name}'


def _format_from_public_id(public_id: str):
    ext = os.path.splitext(public_id)[1].lower().lstrip('.')
    if not ext:
        return None
    return FORMAT_ALIASES.get(ext, ext)


def _extract_public_id_from_cloudinary_url(url):
    match = re.search(r'/upload/(?:v\d+|s--[^/]+--/)?(?:[^/]+/)?(.+?)(?:\?|#|$)', url)
    if not match:
        return None
    return unquote(match.group(1))


def _cloudinary_delivery_url(public_id: str, resource_type=None, format=None) -> str:
    public_id = normalize_public_id(public_id)
    if resource_type is None:
        resource_type = resource_type_for_path(public_id)
    fmt = format or _format_from_public_id(public_id)
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        format=fmt,
        secure=True,
    )
    return url


@lru_cache(maxsize=128)
def _cloudinary_secure_url_from_api(public_id: str) -> str | None:
    """Extensionless public_ids need format + version from Cloudinary (cached)."""
    public_id = normalize_public_id(public_id)
    for resource_type in ('image', 'raw', 'video'):
        try:
            result = cloudinary.api.resource(public_id, resource_type=resource_type)
            return result.get('secure_url')
        except Exception:
            continue
    return None


def _fix_cloudinary_delivery_url(url: str) -> str:
    """Rebuild URL when resource segment or format is wrong."""
    if not url or not url.startswith('http'):
        return url
    public_id = _extract_public_id_from_cloudinary_url(url)
    if not public_id:
        return url
    public_id = normalize_public_id(public_id)
    correct_type = resource_type_for_path(public_id)
    fmt = _format_from_public_id(public_id)

    if f'/{correct_type}/upload/' in url and (fmt or '.' not in os.path.basename(public_id)):
        if not _format_from_public_id(public_id):
            api_url = _cloudinary_secure_url_from_api(public_id)
            if api_url:
                return api_url
        return url

    if not _format_from_public_id(public_id):
        api_url = _cloudinary_secure_url_from_api(public_id)
        if api_url:
            return api_url

    return _cloudinary_delivery_url(public_id, resource_type=correct_type, format=fmt)


def _storage_for_path(stored_name: str):
    """Pick the same storage backend used at upload time."""
    from core.storage import (
        document_storage,
        image_evidence_storage,
        video_audio_storage,
    )
    from django.core.files.storage import default_storage

    lower = (stored_name or '').lower()
    if '/evidence/documents/' in lower or '/documents/' in lower:
        return document_storage
    if '/evidence/images/' in lower or '/images/' in lower:
        return image_evidence_storage
    if '/audio/' in lower:
        return video_audio_storage
    return default_storage


def resolve_media_url(file_or_path):
    """
    Return an absolute https:// URL for API responses.
    Never return bare relative paths — React cannot load those.
    """
    if not file_or_path:
        return None

    stored_name = None
    if hasattr(file_or_path, 'name') and getattr(file_or_path, 'name', None):
        stored_name = file_or_path.name
    elif isinstance(file_or_path, str):
        stored_name = file_or_path.strip()

    if stored_name and stored_name.startswith('http'):
        return _fix_cloudinary_delivery_url(stored_name)

    url = None
    if hasattr(file_or_path, 'url'):
        try:
            url = file_or_path.url
        except Exception:
            url = None

    if url and url.startswith('http'):
        return _fix_cloudinary_delivery_url(url)

    if not stored_name:
        return url if url and url.startswith('/media/') else None

    public_id = normalize_public_id(stored_name)

    if not _format_from_public_id(public_id):
        api_url = _cloudinary_secure_url_from_api(public_id)
        if api_url:
            return api_url

    try:
        storage = _storage_for_path(stored_name)
        built = storage.url(stored_name)
        if built.startswith('http'):
            return _fix_cloudinary_delivery_url(built)
    except Exception:
        pass

    return _cloudinary_delivery_url(public_id)
