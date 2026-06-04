from django.contrib import admin
from .models import StudentProfile

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('get_email', 'unique_student_id', 'is_verified', 'created_at')
    search_fields = ('user__email', 'unique_student_id')
    list_filter = ('is_verified',)
    ordering = ('-created_at',)

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
