from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from .serializer import UserSerializer, EmailSerializer
from .models import Users, Emails
from .utils import verifyUser
import datetime
import os
import base64
import hashlib
import json
import sys

# Add the crypto module to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'quant-sec-client'))
from crypto.crystal.kyber import Kyber512
from crypto.crypto import encrypt as kyber_encrypt_func, decrypt as kyber_decrypt_func


@api_view(["GET"])
@csrf_exempt
def getUserPublicKey(request):
    identifier = request.GET.get("username") or request.GET.get("email")
    # If neither, try to get the first query param value
    if not identifier and len(request.GET) == 1:
        identifier = list(request.GET.values())[0]
    if not identifier:
        return Response({"Message": "Invalid request", "Status": "Negative"})
    identifier = identifier.strip().lower()
    user = None
    # Try username (case-insensitive)
    for fname in os.listdir(USERS_DIR):
        if fname.endswith('.json'):
            uname = fname[:-5].lower()
            if uname == identifier:
                with open(os.path.join(USERS_DIR, fname), 'r') as f:
                    user = json.load(f)
                break
    # Try email (case-insensitive)
    if not user:
        for fname in os.listdir(USERS_DIR):
            if fname.endswith('.json'):
                with open(os.path.join(USERS_DIR, fname), 'r') as f:
                    data = json.load(f)
                    if data.get('email', '').strip().lower() == identifier:
                        user = data
                        break
    if not user:
        return Response({"Message": "The user doesn't exist", "Status": "Negative"})
    return Response({
            "Message": "Request succesfully executed",
            "Status": "Positive",
        "Name": user["name"],
        "Public Key": user["public_key"]
    })


@api_view(["POST"])
@csrf_exempt
def postEmail(request):
    reciever_identifier = ""
    sender_identifier = ""
    aes_encrypted_subject = ""
    aes_encrypted_body = ""
    sender_password = ""

    try:
        reciever_identifier = request.data["reciever_username"]  # can be username or email
        sender_identifier = request.data["sender_username"]      # can be username or email
        aes_encrypted_subject = request.data["subject"]
        aes_encrypted_body = request.data["body"]
        sender_password = request.data["password"]
    except:
        return Response({"Message": "Invalid request", "Status": "Negative"})

    current_datetime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        # Lookup sender by username, then email (file-based)
        sender = None
        if user_exists(sender_identifier):
            sender = load_user(sender_identifier)
        else:
            sender = load_user_by_email(sender_identifier)
        if not sender:
            return Response({"Message": "Sender not found", "Status": "Negative"})
        # Verify sender password
        salt = sender.get("salt")
        hashed_password = hashlib.sha256(str(sender_password + salt).encode("utf-8")).hexdigest()
        if hashed_password != sender.get("hashed_password"):
            return Response({"Message": "Request denied", "Status": "Negative"})
        # Lookup receiver by username, then email (file-based)
        reciever = None
        if user_exists(reciever_identifier):
            reciever = load_user(reciever_identifier)
        else:
            reciever = load_user_by_email(reciever_identifier)
        if not reciever:
            return Response({"Message": "Recipient not found", "Status": "Negative"})
    except Exception as e:
        return Response({
                "Message": f"Email parties don't belong the pool of registered users: {str(e)}",
                "Status": "Negative",
        })

    # Ensure Users model instances exist in database
    try:
        sender_user, _ = Users.objects.get_or_create(
            username=sender["username"],
            defaults={
                'name': sender.get("name", ""),
                'email': sender.get("email", ""),
                'public_key': sender.get("public_key", ""),
                'salt': sender.get("salt", ""),
                'hashed_password': sender.get("hashed_password", "")
            }
        )
        reciever_user, _ = Users.objects.get_or_create(
            username=reciever["username"],
            defaults={
                'name': reciever.get("name", ""),
                'email': reciever.get("email", ""),
                'public_key': reciever.get("public_key", ""),
                'salt': reciever.get("salt", ""),
                'hashed_password': reciever.get("hashed_password", "")
            }
        )
        
        # Store the email in the database
        Emails.objects.create(
            sender=sender_user,
            reciever=reciever_user,
            datetime_of_arrival=current_datetime,
            encrypted_subject=aes_encrypted_subject,
            encrypted_body=aes_encrypted_body,
        )
    except Exception as e:
        return Response({
            "Message": f"Failed to create email: {str(e)}",
            "Status": "Negative"
        })

    return Response({"Message": "Email sent succesfully", "Status": "Positive"})


USERS_DIR = os.path.join(os.path.dirname(__file__), 'users')
if not os.path.exists(USERS_DIR):
    os.makedirs(USERS_DIR)

# --- File-based user helpers ---
def get_user_file(username):
    return os.path.join(USERS_DIR, f'{username}.json')

def user_exists(username):
    return os.path.isfile(get_user_file(username))

def load_user(username):
    try:
        with open(get_user_file(username), 'r') as f:
            return json.load(f)
    except Exception:
        return None

def load_user_by_email(email):
    for fname in os.listdir(USERS_DIR):
        if fname.endswith('.json'):
            with open(os.path.join(USERS_DIR, fname), 'r') as f:
                data = json.load(f)
                if data.get('email') == email:
                    return data
    return None

def save_user(userdata):
    with open(get_user_file(userdata['username']), 'w') as f:
        json.dump(userdata, f)

# --- Registration ---
@api_view(["POST"])
@csrf_exempt
def registerUser(request):
    try:
        name = request.data["name"]
        email = request.data["email"]
        username = request.data["username"]
        public_key = request.data["public_key"]
        private_key = request.data.get("private_key", "")
        password = request.data["password"]
    except:
        return Response({"Message": "Invalid Request", "Status": "Negative"})
    if user_exists(username):
        return Response({"Message": "Username already exists", "Status": "Negative"})
    random_salt = str(base64.b64encode(os.urandom(20)), encoding="utf-8")
    hashed_password = hashlib.sha256(str(password + random_salt).encode("utf-8")).hexdigest()
    user_data = {
        "name": name,
        "email": email,
        "username": username,
        "public_key": public_key,
        "private_key": private_key,
        "salt": random_salt,
        "hashed_password": hashed_password
    }
    try:
        save_user(user_data)
    except Exception as e:
        return Response({"Message": f"Error saving user: {str(e)}", "Status": "Negative"})
    return Response({"Message": "User registered", "Status": "Positive"})

# --- Uniqueness check ---
@api_view(["GET"])
@csrf_exempt
def checkForUniqueness(request):
    username = request.GET.get("username")
    if username is None:
        return Response({"Message": "Invalid request", "Status": "Negative"})
    if user_exists(username):
        return Response({"Message": "A user exists with this username", "Status": "Negative"})
    else:
        return Response({"Message": "The user doesn't exist", "Status": "Positive"})

# --- Login ---
@api_view(["POST"])
@csrf_exempt
def loginUser(request):
    identifier = request.data.get("identifier")  # can be email or username
    password = request.data.get("password")
    if not identifier or not password:
        return Response({"Message": "Missing identifier or password", "Status": "Negative"})
    user = None
    if user_exists(identifier):
        user = load_user(identifier)
    else:
        user = load_user_by_email(identifier)
    if not user:
        return Response({"Message": "User not found", "Status": "Negative"})
    salt = user.get("salt")
    hashed_password = hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest()
    if hashed_password != user.get("hashed_password"):
        return Response({"Message": "Invalid password", "Status": "Negative"})
    # Return user info (including private key)
    return Response({
        "Message": "Login successful",
        "Status": "Positive",
        "name": user["name"],
        "email": user["email"],
        "username": user["username"],
        "public_key": user["public_key"],
        "private_key": user.get("private_key", "")
    })


@api_view(["GET"])
@csrf_exempt
def returnInbox(request):
    identifier = request.GET.get("username")  # can be username or email
    password = request.GET.get("password")

    if identifier is None or password is None:
        return Response({"Message": "Invalid Request", "Status": "Negative"})

    # First check file-based storage for authentication
    user_data = None
    if user_exists(identifier):
        user_data = load_user(identifier)
    else:
        user_data = load_user_by_email(identifier)
    
    if not user_data:
        return Response({"Message": "User not found", "Status": "Negative"})
    
    # Verify password using file-based data
    salt = user_data.get("salt")
    hashed_password = hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest()
    if hashed_password != user_data.get("hashed_password"):
        return Response({"Message": "Request denied", "Status": "Negative"})

    # Ensure user exists in database for email queries
    user, _ = Users.objects.get_or_create(
        username=user_data["username"],
        defaults={
            'name': user_data.get("name", ""),
            'email': user_data.get("email", ""),
            'public_key': user_data.get("public_key", ""),
            'salt': user_data.get("salt", ""),
            'hashed_password': user_data.get("hashed_password", "")
        }
    )

    emails = user.recieved.filter(synced=False)
    serializer = EmailSerializer(emails, many=True).data
    # Add sender email to each email
    for i, email in enumerate(emails):
        serializer[i]["sender_email"] = email.sender.email if hasattr(email.sender, 'email') else ""
        serializer[i]["sender_name"] = email.sender.name if hasattr(email.sender, 'name') else ""
    for email in emails:
        email.synced = True
        email.save()

    return Response(
        {"Message": "Request completed", "Status": "Positive", "Emails": serializer}
    )


@api_view(["POST"])
@csrf_exempt
def clearInbox(request):
    username = request.data.get("username")
    password = request.data.get("password")
    if username == None or password == None:
        return Response({"Message": "Invalid Request", "Status": "Negative"})

    # First check file-based storage for authentication
    user_data = load_user(username)
    if not user_data:
        return Response({"Message": "User not found", "Status": "Negative"})
    
    # Verify password using file-based data
    salt = user_data.get("salt")
    hashed_password = hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest()
    if hashed_password != user_data.get("hashed_password"):
        return Response({"Message": "Request denied", "Status": "Negative"})

    # Get or create user in database for email operations
    user, _ = Users.objects.get_or_create(
        username=user_data["username"],
        defaults={
            'name': user_data.get("name", ""),
            'email': user_data.get("email", ""),
            'public_key': user_data.get("public_key", ""),
            'salt': user_data.get("salt", ""),
            'hashed_password': user_data.get("hashed_password", "")
        }
    )

    user.recieved.all().delete()

    return Response({"Message": "Deletion succesfull", "Status": "Positive"})


@api_view(["POST"])
@csrf_exempt
def kyber_keygen(request):
    """Generate a new Kyber key pair using the real implementation"""
    try:
        # Use the real Kyber implementation
        public_key, private_key = Kyber512.keygen()
        
        return Response({
            "Message": "Key pair generated successfully",
            "Status": "Positive",
            "public_key": str(base64.b64encode(public_key), encoding="utf-8"),
            "private_key": str(base64.b64encode(private_key), encoding="utf-8")
        })
    except Exception as e:
        return Response({
            "Message": f"Key generation failed: {str(e)}",
            "Status": "Negative"
        })

@api_view(["POST"])
@csrf_exempt
def kyber_encrypt(request):
    """Encrypt a message using real Kyber + AES + HMAC"""
    try:
        message = request.data.get("message")
        receiver_public_key = request.data.get("receiver_public_key")
        
        if not message or not receiver_public_key:
            return Response({
                "Message": "Missing message or receiver_public_key",
                "Status": "Negative"
            })
        
        # Decode the public key
        receiver_public_key_bytes = base64.b64decode(receiver_public_key)
        
        # Use the real encryption function (no name conflict)
        encrypted_data = kyber_encrypt_func(message, receiver_public_key)
        
        return Response({
            "Message": "Message encrypted successfully",
            "Status": "Positive",
            "encrypted_data": encrypted_data
        })
    except Exception as e:
        return Response({
            "Message": f"Encryption failed: {str(e)}",
            "Status": "Negative"
        })


def kyber_decrypt_with_key(tag, concatenated_string, receiver_private_key):
    """
    Decrypt function that accepts private key directly instead of reading from file
    """
    try:
        # Verify it against the tag
        gen_tag = hashlib.sha256(concatenated_string.encode()).hexdigest()
        if tag != gen_tag:
            raise ValueError(f"MAC verification failed - Expected tag: {gen_tag}, Got tag: {tag}")

        enc_data = json.loads(concatenated_string)
        cipher_text = enc_data["cipher_text"]
        encrypted_passkey = enc_data["encrypted_passkey"]
        salt = enc_data["salt"]

        # Decrypt the passkey using provided private key
        passkey = Kyber512.dec(
            base64.b64decode(encrypted_passkey), base64.b64decode(receiver_private_key)
        )

        # Import the AES decryption function
        import crypto.aes as aes

        # Decrypt the cipher text using the decrypted passkey
        decrypted_cipher = aes.decrypt(
            {"salt": salt, "cipher_text": cipher_text},
            str(base64.b64encode(passkey), encoding="utf-8"),
        )

        return str(decrypted_cipher, encoding="utf-8")
    except Exception as e:
        # Add more detailed error information
        raise ValueError(f"Decryption failed: {str(e)}")


@api_view(["POST"])
@csrf_exempt
def kyber_decrypt(request):
    """Decrypt a message using real Kyber + AES + HMAC"""
    try:
        tag = request.data.get("tag")
        concatenated_string = request.data.get("concatenated_string")
        username = request.data.get("username")
        private_key = request.data.get("private_key")  # Accept private key from client
        
        if not tag or not concatenated_string or not username:
            return Response({
                "Message": "Missing tag, concatenated_string, or username",
                "Status": "Negative"
            })
        
        # If private key is provided, use it directly (for web clients)
        if private_key:
            decrypted_message = kyber_decrypt_with_key(tag, concatenated_string, private_key)
        else:
            # Try to get private key from file-based storage for CLI clients
            try:
                user_data = load_user(username)
                if user_data and user_data.get("private_key"):
                    decrypted_message = kyber_decrypt_with_key(tag, concatenated_string, user_data["private_key"])
                else:
                    # Fallback to original file-based lookup for CLI clients
                    decrypted_message = kyber_decrypt_func(tag, concatenated_string, username)
            except Exception:
                # Last fallback to original function
                decrypted_message = kyber_decrypt_func(tag, concatenated_string, username)
        
        return Response({
            "Message": "Message decrypted successfully",
            "Status": "Positive",
            "decrypted_message": decrypted_message
        })
    except Exception as e:
        return Response({
            "Message": f"Decryption failed: {str(e)}",
            "Status": "Negative"
        })
