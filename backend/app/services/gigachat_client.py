import uuid
from typing import Any
import requests
from app.core.config import settings

class GigaChatClient:
    def __init__(self):
        self.auth_key = settings.gigachat_auth_key
        self.scope = settings.gigachat_scope
        self.oauth_url = settings.gigachat_oauth_url
        self.base_url = settings.gigachat_base_url
        self.model = settings.gigachat_model
        self.verify_ssl = settings.gigachat_verify_ssl

    def get_access_token(self) -> str:
        headers = {
            "Authorization": f"Basic {self.auth_key}",
            "RqUID": str(uuid.uuid4()),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        data = {
            "scope": self.scope
        }

        response = requests.post(
            self.oauth_url,
            headers=headers,
            data=data,
            verify=self.verify_ssl,
            timeout=30,
        )

        response.raise_for_status()
        token_data = response.json()

        return token_data["access_token"]

    def generate_response(self, user_message: str, system_message: str | None = None) -> str:
        access_token = self.get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        messages: list[dict[str, Any]] = []

        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })

        messages.append({
            "role": "user",
            "content": user_message
        })

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
        }

        response = requests.post(
            f"{self.base_url}/api/v1/chat/completions",
            headers=headers,
            json=payload,
            verify=self.verify_ssl,
            timeout=60,
        )

        response.raise_for_status()
        result = response.json()

        return result["choices"][0]["message"]["content"]