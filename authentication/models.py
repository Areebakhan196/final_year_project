import random
import string
from django.db import models
from django.contrib.auth.models import User

def generate_student_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    is_verified = models.BooleanField(default=False)
    unique_student_id = models.CharField(max_length=20, unique=True, editable=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.unique_student_id:
            self.unique_student_id = generate_student_id()
            while StudentProfile.objects.filter(unique_student_id=self.unique_student_id).exists():
                self.unique_student_id = generate_student_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} ({self.unique_student_id})"
