from django.urls import path
import quantserver.views as vi

urlpatterns = [
    path("get-public-key", vi.getUserPublicKey),
    path("post-email", vi.postEmail),
    path("register-user", vi.registerUser),
    path("check-uniqueness", vi.checkForUniqueness),
    path("get-inbox", vi.returnInbox),
    path("clear-inbox", vi.clearInbox),
    path("kyber-keygen", vi.kyber_keygen),
    path("kyber-encrypt", vi.kyber_encrypt),
    path("kyber-decrypt", vi.kyber_decrypt),
    path("login-user", vi.loginUser),
]
