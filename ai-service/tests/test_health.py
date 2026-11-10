import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app  # noqa: E402


def client():
    return create_app().test_client()


def test_health_endpoint():
    res = client().get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "UP"


def test_chat_requires_a_message():
    res = client().post("/api/chat", json={"message": "  "})
    assert res.status_code == 400


def test_chat_uses_rule_based_fallback_without_llm_key(monkeypatch):
    import routes.chatbot as chatbot

    monkeypatch.setattr(chatbot, "GROQ_API_KEY", "")
    res = client().post("/api/chat", json={"message": "bonjour", "userId": 1})
    assert res.status_code == 200
    assert "response" in res.get_json()


def test_unknown_route_returns_json_404():
    res = client().get("/api/does-not-exist")
    assert res.status_code == 404
    assert res.get_json()["error"] == "Not found"
