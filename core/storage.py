import os

from cloudinary_storage.storage import MediaCloudinaryStorage, RawMediaCloudinaryStorage

from core.media_urls import resource_type_for_path


class AutoMediaCloudinaryStorage(MediaCloudinaryStorage):
    """
    Default storage: infer resource type from extension/path (audio → video, etc.).
    Do NOT treat all files under /evidence/ as images — that breaks PDF uploads.
    """

    def _get_resource_type(self, name):
        return resource_type_for_path(name)


class ImageMediaCloudinaryStorage(MediaCloudinaryStorage):
    """Evidence images (JPG, PNG, …)."""

    def _get_resource_type(self, name):
        return 'image'


class VideoMediaCloudinaryStorage(MediaCloudinaryStorage):
    """Voice notes and audio uploads."""

    def _get_resource_type(self, name):
        return 'video'


class DocumentMediaCloudinaryStorage(RawMediaCloudinaryStorage):
    """PDF, DOC, DOCX — Cloudinary raw resource type."""


def save_to_storage(storage, prefix: str, uploaded_file) -> str:
    """Upload via the given storage backend; return the stored name/path."""
    filename = storage.get_valid_name(uploaded_file.name)
    path = os.path.join(prefix, filename).replace('\\', '/')
    return storage.save(path, uploaded_file)


# Used by complaints.views for explicit image vs document uploads
image_evidence_storage = ImageMediaCloudinaryStorage()
document_storage = DocumentMediaCloudinaryStorage()
video_audio_storage = VideoMediaCloudinaryStorage()
