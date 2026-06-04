import uuid
import random
import string
from django.db import models
from security.utils import encryption_tool

def generate_tracking_id():
    """Generates a secure, non-sequential unique tracking ID."""
    prefix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    suffix = ''.join(random.choices(string.digits, k=6))
    return f"{prefix}-{suffix}"

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    ]

    # Registered students reuse their unique_student_id; multiple complaints may share the same value.
    tracking_id = models.CharField(max_length=20, editable=False, db_index=True)
    submitted_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints_submitted',
    )
    encrypted_text = models.TextField(blank=True, null=True)
    audio_file = models.FileField(upload_to='complaints/audio/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            # Ensure uniqueness
            self.tracking_id = generate_tracking_id()
            while Complaint.objects.filter(tracking_id=self.tracking_id).exists():
                self.tracking_id = generate_tracking_id()
        super().save(*args, **kwargs)

    @property
    def decrypted_text(self):
        return encryption_tool.decrypt(self.encrypted_text)

    def __str__(self):
        return f"Complaint #{self.pk} ({self.tracking_id}) - {self.status}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"

class ComplaintEvidence(models.Model):
    complaint = models.ForeignKey(Complaint, related_name='evidences', on_delete=models.CASCADE)
    file = models.FileField(upload_to='complaints/evidence/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidence for {self.complaint.tracking_id}"
