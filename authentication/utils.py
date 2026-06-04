import logging
from django.core.mail import send_mail
from django.core.signing import Signer, BadSignature, SignatureExpired
from django.conf import settings

logger = logging.getLogger('django')
signer = Signer(salt='email-verification')

def generate_verification_token(email):
    return signer.sign(email)

def verify_token(token, max_age=86400):  # 24 hours
    try:
        email = signer.unsign(token, max_age=max_age)
        return email
    except (BadSignature, SignatureExpired):
        return None

def send_verification_email(user, request):
    token = generate_verification_token(user.email)
    
    # Construct verification link
    # Since Vite frontend proxies /api requests, we can direct the click directly to the backend endpoint
    # which redirects the user back to the frontend login page.
    # Note: request.build_absolute_uri handles protocol (http/https) and host correctly.
    relative_url = f"/api/auth/verify-email/{token}/"
    verification_link = request.build_absolute_uri(relative_url)
    
    subject = "Verify Your Account - The Silent Reporter"
    message = (
        f"Welcome to The Silent Reporter!\n\n"
        f"Please click the link below to verify your account and activate your registration:\n"
        f"{verification_link}\n\n"
        f"If you did not request this, please ignore this email."
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'The Silent Reporter <noreply@silentreporter.com>')
    
    try:
        send_mail(
            subject,
            message,
            from_email,
            [user.email],
            fail_silently=False,
        )
        logger.info(f"Verification email successfully sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")
        # Always print to console in case SMTP is down/unconfigured so developers can grab the link
        print(f"\n--- EMAIL VERIFICATION LINK FOR {user.email} ---\n{verification_link}\n-------------------------------------------\n")
