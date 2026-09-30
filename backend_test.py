#!/usr/bin/env python3
"""
BicaraPro Backend Regression Test - Audio Format Compatibility
Tests WAV, WEBM/OPUS, M4A, and MP3 uploads after ffmpeg fix
"""
import os
import sys
import json
import subprocess
import tempfile
from pathlib import Path

import requests

# Backend URL from environment
BACKEND_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://app-dev-hub-4278.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
TEST_EMAIL = "siswa@smkbinaguna.sch.id"
TEST_PASSWORD = "siswa123"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def log_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")


def log_error(msg):
    print(f"{RED}❌ {msg}{RESET}")


def log_info(msg):
    print(f"{YELLOW}ℹ️  {msg}{RESET}")


def generate_test_audio(format_type: str) -> tuple[str, str]:
    """Generate test audio file using ffmpeg.
    
    Returns: (file_path, mimetype)
    """
    log_info(f"Generating {format_type} test audio...")
    
    if format_type == "wav":
        path = "/tmp/test_audio.wav"
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-ar", "22050", "-ac", "1", path
        ]
        mimetype = "audio/wav"
    elif format_type == "webm":
        path = "/tmp/test_audio.webm"
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:a", "libopus", path
        ]
        mimetype = "audio/webm"
    elif format_type == "m4a":
        path = "/tmp/test_audio.m4a"
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:a", "aac", path
        ]
        mimetype = "audio/mp4"
    elif format_type == "mp3":
        path = "/tmp/test_audio.mp3"
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:a", "libmp3lame", path
        ]
        mimetype = "audio/mpeg"
    else:
        raise ValueError(f"Unknown format: {format_type}")
    
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"Failed to generate {format_type}: {result.stderr.decode()}")
    
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        raise RuntimeError(f"Generated {format_type} file is empty or missing")
    
    log_success(f"Generated {format_type} at {path} ({os.path.getsize(path)} bytes)")
    return path, mimetype


def login() -> str:
    """Login and return access token."""
    log_info("Logging in as siswa...")
    resp = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10
    )
    
    if resp.status_code != 200:
        log_error(f"Login failed: {resp.status_code} - {resp.text}")
        sys.exit(1)
    
    data = resp.json()
    token = data.get("access_token")
    if not token:
        log_error("No access_token in login response")
        sys.exit(1)
    
    log_success(f"Logged in successfully as {data['user']['name']}")
    return token


def test_audio_upload(token: str, format_type: str) -> dict:
    """Test audio upload for a specific format.
    
    Returns: analysis response dict
    """
    print(f"\n{'='*60}")
    print(f"Testing {format_type.upper()} upload")
    print(f"{'='*60}")
    
    # Generate test audio
    audio_path, mimetype = generate_test_audio(format_type)
    
    # Upload
    log_info(f"Uploading {format_type} to POST /api/analyses...")
    with open(audio_path, "rb") as f:
        files = {
            "file": (f"test_audio.{format_type}", f, mimetype)
        }
        data = {
            "title": f"Test {format_type.upper()} Upload"
        }
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        resp = requests.post(
            f"{API_BASE}/analyses",
            files=files,
            data=data,
            headers=headers,
            timeout=60
        )
    
    # Check response
    if resp.status_code != 200:
        log_error(f"Upload failed: HTTP {resp.status_code}")
        log_error(f"Response: {resp.text}")
        return None
    
    log_success(f"Upload successful: HTTP {resp.status_code}")
    
    # Parse response
    try:
        analysis = resp.json()
    except Exception as e:
        log_error(f"Failed to parse JSON response: {e}")
        log_error(f"Response text: {resp.text}")
        return None
    
    # Validate response fields
    errors = []
    
    # Check required numeric fields
    for field in ["intonation_score", "clarity_score", "overall_score"]:
        if field not in analysis:
            errors.append(f"Missing field: {field}")
        elif not isinstance(analysis[field], (int, float)):
            errors.append(f"{field} is not numeric: {type(analysis[field])}")
    
    # Check duration
    if "duration_seconds" not in analysis:
        errors.append("Missing field: duration_seconds")
    elif analysis["duration_seconds"] <= 0:
        errors.append(f"duration_seconds is not positive: {analysis['duration_seconds']}")
    
    # Check corrected_transcript
    if "corrected_transcript" not in analysis:
        errors.append("Missing field: corrected_transcript")
    elif not analysis["corrected_transcript"]:
        errors.append("corrected_transcript is empty")
    elif not isinstance(analysis["corrected_transcript"], str):
        errors.append(f"corrected_transcript is not string: {type(analysis['corrected_transcript'])}")
    
    # Check pronunciation_tips
    if "pronunciation_tips" not in analysis:
        errors.append("Missing field: pronunciation_tips")
    elif not analysis["pronunciation_tips"]:
        errors.append("pronunciation_tips is empty")
    elif not isinstance(analysis["pronunciation_tips"], str):
        errors.append(f"pronunciation_tips is not string: {type(analysis['pronunciation_tips'])}")
    
    # Check audio_url
    if "audio_url" not in analysis:
        errors.append("Missing field: audio_url")
    elif not analysis["audio_url"]:
        errors.append("audio_url is empty")
    
    # Report results
    if errors:
        log_error(f"Validation failed for {format_type}:")
        for err in errors:
            print(f"  - {err}")
        return None
    
    # Success - print key fields
    log_success(f"All fields validated for {format_type}")
    print(f"  intonation_score: {analysis['intonation_score']}")
    print(f"  clarity_score: {analysis['clarity_score']}")
    print(f"  overall_score: {analysis['overall_score']}")
    print(f"  duration_seconds: {analysis['duration_seconds']}")
    print(f"  corrected_transcript: {analysis['corrected_transcript'][:80]}...")
    print(f"  pronunciation_tips: {analysis['pronunciation_tips'][:80]}...")
    print(f"  audio_url: {analysis['audio_url']}")
    
    return analysis


def test_get_analysis(token: str, analysis_id: str):
    """Test GET /api/analyses/{id}."""
    log_info(f"Testing GET /api/analyses/{analysis_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(
        f"{API_BASE}/analyses/{analysis_id}",
        headers=headers,
        timeout=10
    )
    
    if resp.status_code != 200:
        log_error(f"GET analysis failed: HTTP {resp.status_code}")
        log_error(f"Response: {resp.text}")
        return False
    
    log_success(f"GET analysis successful: HTTP {resp.status_code}")
    
    try:
        data = resp.json()
    except Exception as e:
        log_error(f"Failed to parse JSON: {e}")
        return False
    
    # Validate fields are intact
    required_fields = [
        "id", "intonation_score", "clarity_score", "overall_score",
        "duration_seconds", "corrected_transcript", "pronunciation_tips",
        "audio_url"
    ]
    
    missing = [f for f in required_fields if f not in data]
    if missing:
        log_error(f"Missing fields in GET response: {missing}")
        return False
    
    log_success("All fields present in GET response")
    return True


def test_get_audio(token: str, analysis_id: str):
    """Test GET /api/analyses/{id}/audio."""
    log_info(f"Testing GET /api/analyses/{analysis_id}/audio...")
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(
        f"{API_BASE}/analyses/{analysis_id}/audio",
        headers=headers,
        params={"token": token},
        timeout=10
    )
    
    if resp.status_code != 200:
        log_error(f"GET audio failed: HTTP {resp.status_code}")
        log_error(f"Response: {resp.text}")
        return False
    
    log_success(f"GET audio successful: HTTP {resp.status_code}")
    
    # Check content type
    content_type = resp.headers.get("Content-Type", "")
    if not content_type.startswith("audio/"):
        log_error(f"Unexpected Content-Type: {content_type}")
        return False
    
    # Check content length
    content_length = len(resp.content)
    if content_length == 0:
        log_error("Audio file is empty")
        return False
    
    log_success(f"Audio file retrieved: {content_length} bytes, Content-Type: {content_type}")
    return True


def main():
    print("\n" + "="*60)
    print("BicaraPro Audio Format Compatibility Test")
    print("Testing: WAV, WEBM/OPUS, M4A, MP3")
    print("="*60 + "\n")
    
    # Login
    token = login()
    
    # Test all formats
    formats = ["wav", "webm", "m4a", "mp3"]
    results = {}
    
    for fmt in formats:
        analysis = test_audio_upload(token, fmt)
        results[fmt] = {
            "upload_success": analysis is not None,
            "analysis_id": analysis.get("id") if analysis else None
        }
    
    # For WEBM (the critical one), also test GET endpoints
    if results["webm"]["upload_success"] and results["webm"]["analysis_id"]:
        print(f"\n{'='*60}")
        print("Testing GET endpoints for WEBM analysis")
        print(f"{'='*60}")
        
        analysis_id = results["webm"]["analysis_id"]
        results["webm"]["get_analysis_success"] = test_get_analysis(token, analysis_id)
        results["webm"]["get_audio_success"] = test_get_audio(token, analysis_id)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for fmt in formats:
        status = "✅ PASS" if results[fmt]["upload_success"] else "❌ FAIL"
        print(f"{fmt.upper():8} upload: {status}")
        
        if not results[fmt]["upload_success"]:
            all_passed = False
    
    # WEBM GET tests
    if "get_analysis_success" in results["webm"]:
        status = "✅ PASS" if results["webm"]["get_analysis_success"] else "❌ FAIL"
        print(f"WEBM     GET /api/analyses/{{id}}: {status}")
        if not results["webm"]["get_analysis_success"]:
            all_passed = False
    
    if "get_audio_success" in results["webm"]:
        status = "✅ PASS" if results["webm"]["get_audio_success"] else "❌ FAIL"
        print(f"WEBM     GET /api/analyses/{{id}}/audio: {status}")
        if not results["webm"]["get_audio_success"]:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print(f"\n{GREEN}🎉 ALL TESTS PASSED{RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{RED}❌ SOME TESTS FAILED{RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
