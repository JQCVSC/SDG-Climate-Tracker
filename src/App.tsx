import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  Marker, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FileCode, 
  Eye, 
  Wind, 
  Database,
  Send,
  CheckCircle2,
  Search,
  Navigation,
  Loader2,
  X,
  MapPin,
  Flame,
  AlertCircle,
  Globe,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { CleanAirActionToolkit } from './components/CleanAirActionToolkit';
import { CleanAirRec, getCommunityActionAnalysis } from './cleanAirData';
import { CommunityActionAnalysisCard } from './components/CommunityActionAnalysisCard';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const REQUIREMENTS_TXT = `Flask==3.0.3
requests==2.32.3
gunicorn==22.0.0
google-cloud-firestore==2.16.0
google-genai==1.0.0`;

const MAIN_PY = `import os
import hashlib
import json
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import requests

# Google Cloud Firestore Client
try:
    from google.cloud import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False

# -----------------------------------------------------------------------------
# Configuration & API Keys
# -----------------------------------------------------------------------------
# Retrieve Google Cloud API Keys from environment variables
API_KEY = os.environ.get("AIR_QUALITY_API_KEY", "")
MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# -----------------------------------------------------------------------------
# Gemini AI Client & System Instructions
# -----------------------------------------------------------------------------
GEMINI_SYSTEM_INSTRUCTION = """
You are the AI Urban Clean Air & Civic Action Advisor for the SDG 13 Clean Air Climate Pledge Platform.
Your mission is to provide rigorous, actionable, and encouraging guidance to community members who submit clean air pledges.

Guidelines for how you must act:
1. Ground your analysis in atmospheric science and public health (reducing PM2.5, NO2, VOCs, and ground ozone).
2. Structure your response with 3 realistic community milestones:
   - Step 1: Today (Immediate 24-hour personal habit / anti-idling / indoor air fix)
   - Step 2: This Week (Neighborhood, PTA, or workplace activation)
   - Step 3: Month 1 & Beyond (Civic advocacy, city council testimony, tree buffers, or policy levers)
3. Keep instructions concise, optimistic, and directly focused on localized emissions cuts and respiratory protection.
4. Never provide dangerous or unverified medical advice.
"""

def generate_ai_pledge_analysis(name, category, pledge_text, impact_tier, location_name="San Francisco, CA"):
    """
    Calls Google GenAI SDK (gemini-3.7-flash / gemini-flash-latest / gemini-3.1-flash-lite) with system instructions.
    Returns structured roadmap (summary, step1, step2, step3, emissions cut, health benefit).
    """
    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = f"""
Participant Name: {name}
Location: {location_name}
Action Category: {category}
Impact Tier: {impact_tier}
Pledge Commitment: "{pledge_text}"

Generate a structured civic execution assessment. Return ONLY a JSON object with:
"summaryAnalysis": "1-2 sentences analyzing emissions impact",
"keyEmissionsCut": "Estimated emissions prevented (e.g. ~350 kg CO2e / 4.2 kg PM2.5 annually)",
"localHealthBenefit": "Local public health and respiratory benefit",
"step1": "Step 1 (Today / First 24h): Specific immediate personal habit step",
"step2": "Step 2 (This Week / Days 2-7): Specific community or household action",
"step3": "Step 3 (Month 1+): Long-term civic or policy advocacy step"
"""
            for model_name in ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=GEMINI_SYSTEM_INSTRUCTION,
                            response_mime_type="application/json",
                            temperature=0.3,
                        )
                    )
                    if response and response.text:
                        parsed = json.loads(response.text)
                        return {
                            "source": f"Google Gemini AI ({model_name})",
                            "summaryAnalysis": parsed.get("summaryAnalysis", "Targeted civic action reducing localized urban emissions."),
                            "keyEmissionsCut": parsed.get("keyEmissionsCut", "Reduces localized particulate matter and NOx emissions."),
                            "localHealthBenefit": parsed.get("localHealthBenefit", "Protects community respiratory health and mitigates urban smog."),
                            "step1": parsed.get("step1", "Establish your personal zero-emissions routine today."),
                            "step2": parsed.get("step2", "Share clean air guidelines with your neighborhood, school, or workplace."),
                            "step3": parsed.get("step3", "Advocate with municipal leaders for cleaner transport infrastructure."),
                            "text": f"Impact Analysis: {parsed.get('summaryAnalysis', '')}\\n\\n• Step 1 (Today): {parsed.get('step1', '')}\\n• Step 2 (This Week): {parsed.get('step2', '')}\\n• Step 3 (Month 1+): {parsed.get('step3', '')}"
                        }
                except Exception as model_err:
                    err_str = str(model_err)
                    if "503" in err_str or "high demand" in err_str or "UNAVAILABLE" in err_str:
                        continue
                    print(f"[Gemini AI] Note for {model_name}: {model_err}")
        except Exception as e:
            print(f"[Gemini AI] Pledge analysis call failed: {e}")

    return {
        "source": "Clean Air Action Engine (Built-in)",
        "summaryAnalysis": f"Your pledge under {category} directly targets urban emission sources in {location_name}.",
        "keyEmissionsCut": "Estimated ~320 kg CO2e and 2.8 kg fine particulates prevented per participant annually.",
        "localHealthBenefit": "Reduces street-level toxic plumes, protecting developing lungs and vulnerable seniors.",
        "step1": "Establish your personal anti-emissions routine and setup zero-idling habits in school/curbside pickup lines.",
        "step2": "Activate your neighborhood and school network with clean air guidelines and flyer distribution.",
        "step3": "Engage municipal leadership for clean transit corridors and hyper-local air monitoring.",
        "text": f"• Step 1 (Today): Establish your personal anti-emissions routine.\\n• Step 2 (This Week): Activate your neighborhood and school network.\\n• Step 3 (Month 1+): Engage municipal leadership for clean transit corridors."
    }

def generate_ai_aqi_advisory(location_name, aqi_val, category, pollutant):
    """
    Asks Gemini to generate real-time localized advice based on specific AQI conditions.
    """
    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = f"""
Location: {location_name}
Air Quality Index: {aqi_val} ({category})
Dominant Pollutant: {pollutant}

Provide tailored environmental health and climate action guidance.
Return ONLY a valid JSON object with exactly these keys:
"headline": "A short, engaging 1-sentence assessment of air conditions in {location_name}",
"outdoor": "Advice for outdoor exercise and activities",
"indoor": "Advice for indoor air filtration and window ventilation",
"commute": "Advice for transportation and commuting mode choice",
"action": "Immediate individual or civic action to reduce pollution"
"""
            for model_name in ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction="You are an expert environmental atmospheric scientist and public health advisor. Output valid JSON only.",
                            response_mime_type="application/json",
                            temperature=0.3,
                        )
                    )
                    if response and response.text:
                        parsed = json.loads(response.text)
                        parsed["source"] = f"Google Gemini AI ({model_name})"
                        return parsed
                except Exception as model_err:
                    err_str = str(model_err)
                    if "503" in err_str or "high demand" in err_str or "UNAVAILABLE" in err_str:
                        continue
                    print(f"[Gemini AQI Advisory Error for {model_name}]: {model_err}")
        except Exception as e:
            print(f"[Gemini AQI Advisory Error]: {e}")
            
    cat_lower = str(category).lower()
    is_good = "good" in cat_lower or "excellent" in cat_lower or (isinstance(aqi_val, (int, float)) and aqi_val <= 50 and "moderate" not in cat_lower and "unhealthy" not in cat_lower)
    is_unhealthy = ("unhealthy" in cat_lower or "poor" in cat_lower or "hazard" in cat_lower or (isinstance(aqi_val, (int, float)) and aqi_val > 100)) and not is_good
    is_moderate = not is_good and not is_unhealthy

    if is_unhealthy:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air pollution in {location_name} is elevated (AQI: {aqi_val}, {pollutant}). Sensitive groups should take immediate protective measures.",
            "outdoor": f"Limit prolonged outdoor physical exertion. Elevated {pollutant} levels can trigger respiratory irritation and asthma flare-ups.",
            "indoor": "Keep windows closed and run HEPA air cleaners. Avoid indoor combustion such as candles or unvented cooking.",
            "commute": "Avoid walking or cycling along congested traffic corridors during rush hour; use filtered cabin AC in transit.",
            "action": "Delay discretionary driving trips, eliminate all open yard burning, and report excessive industrial or diesel emissions."
        }
    elif is_moderate:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air quality in {location_name} is acceptable (AQI: {aqi_val}, {pollutant}). Conditions are suitable for most daily activities.",
            "outdoor": f"Enjoy outdoor sports and recreation, though sensitive individuals should monitor respiration with elevated {pollutant}.",
            "indoor": "Naturally ventilate living spaces during late morning and early afternoon when traffic-related emissions disperse.",
            "commute": "Great day to walk, cycle, or take electrified transit along designated low-traffic neighborhood greenways.",
            "action": "Practice zero-idling at school and transit pickup zones, and check tire pressures to cut non-exhaust particulate wear."
        }
    else:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air quality in {location_name} is pristine and healthy (AQI: {aqi_val}). Ideal atmospheric conditions across the region.",
            "outdoor": "Perfect conditions for all outdoor sports, running, cycling, and children's park activities.",
            "indoor": "Excellent time to open windows across your home to flush out indoor CO2 and introduce clean fresh air.",
            "commute": "Maximize walking and bicycling for short errands to keep vehicular tailpipe emissions near zero.",
            "action": "Encourage neighborhood active transport and support local municipal clean air and tree canopy initiatives."
        }


app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "climate-pledge-sdg13-secret-key-2026")

# -----------------------------------------------------------------------------
# Database Initialization (Google Cloud Firestore)
# -----------------------------------------------------------------------------
db = None
db_status = "In-Memory Fallback"

if FIRESTORE_AVAILABLE:
    try:
        db = firestore.Client()
        db_status = "Google Cloud Firestore (Connected)"
    except Exception as e:
        db = None
        db_status = f"Local Mode (Firestore not initialized: {str(e)[:40]})"
else:
    db_status = "Local Mode (google-cloud-firestore not installed)"

fallback_pledges = []


def get_all_pledges():
    if db is not None:
        try:
            docs = db.collection("pledges").stream()
            results = []
            seen_entries = set()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                dedup_key = f"{data.get('name', '').strip()}_{data.get('pledge', '').strip()}_{data.get('timestamp', '')}"
                if dedup_key in seen_entries:
                    continue
                seen_entries.add(dedup_key)
                results.append(data)

            def sort_key(p):
                return str(p.get("created_at") or p.get("timestamp") or "")

            results.sort(key=sort_key, reverse=True)
            return results
        except Exception as e:
            print(f"[Firestore Read Error]: {e}")
            return fallback_pledges
    return fallback_pledges


def save_pledge(pledge_data, submission_id=None):
    if db is not None:
        try:
            if submission_id and len(submission_id.strip()) > 5:
                doc_id = f"pledge_{submission_id.strip()}"
            else:
                raw_token = f"{pledge_data.get('name')}_{pledge_data.get('pledge')}_{datetime.utcnow().strftime('%Y%m%d%H')}"
                doc_id = f"pledge_{hashlib.md5(raw_token.encode('utf-8')).hexdigest()[:16]}"

            doc_ref = db.collection("pledges").document(doc_id)
            db_data = pledge_data.copy()
            db_data["created_at"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(db_data, merge=True)
            return True
        except Exception as e:
            print(f"[Firestore Write Error]: {e}")
            is_dup = any(p.get("name") == pledge_data.get("name") and p.get("pledge") == pledge_data.get("pledge") for p in fallback_pledges)
            if not is_dup:
                fallback_pledges.insert(0, pledge_data)
            return False
    else:
        is_dup = any(p.get("name") == pledge_data.get("name") and p.get("pledge") == pledge_data.get("pledge") for p in fallback_pledges)
        if not is_dup:
            fallback_pledges.insert(0, pledge_data)
        return True


def fetch_air_quality(lat=37.7749, lng=-122.4194):
    active_key = os.environ.get("AIR_QUALITY_API_KEY", API_KEY)
    if not active_key or active_key == "YOUR_API_KEY_HERE":
        return {
            "aqi": 34,
            "category": "Good",
            "dominant_pollutant": "PM2.5",
            "health_recommendation": "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            "color": "emerald",
            "location_name": "San Francisco, CA (Sample Default)",
            "is_live": False,
            "status_message": "Using sample AQI data. Configure API_KEY with your Google Cloud Key to activate live requests."
        }

    endpoint = f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={active_key}"
    payload = {
        "universalAqi": True,
        "location": { "latitude": float(lat), "longitude": float(lng) },
        "extraComputations": [ "HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION" ]
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            indexes = data.get("indexes", [])
            primary_index = indexes[0] if indexes else {}
            aqi_val = primary_index.get("aqi", 42)
            category = primary_index.get("category", "Moderate")
            dominant_pollutant = primary_index.get("dominantPollutant", "PM2.5")
            health_recs = data.get("healthRecommendations", {})
            general_rec = health_recs.get("generalPopulation", "Enjoy your usual outdoor activities.")
            color_map = {
                "Good": "emerald", "Moderate": "amber", "Unhealthy for sensitive groups": "orange",
                "Unhealthy": "rose", "Very unhealthy": "purple", "Hazardous": "red"
            }
            return {
                "aqi": aqi_val, "category": category, "dominant_pollutant": dominant_pollutant,
                "health_recommendation": general_rec, "color": color_map.get(category, "emerald"),
                "location_name": f"Lat: {lat}, Lng: {lng}", "is_live": True,
                "status_message": "Live data fetched from Google Air Quality API."
            }
        else:
            return {
                "aqi": 38, "category": "Moderate", "dominant_pollutant": "PM2.5",
                "health_recommendation": "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.",
                "color": "amber", "location_name": f"Coordinates ({lat}, {lng})", "is_live": False,
                "status_message": f"Google Air Quality API returned HTTP {response.status_code}"
            }
    except Exception as e:
        return {
            "aqi": 45, "category": "Moderate", "dominant_pollutant": "PM10",
            "health_recommendation": "Could not connect to external API endpoint. Standard air guidelines apply.",
            "color": "amber", "location_name": "Offline Mode", "is_live": False,
            "status_message": f"Connection notice: {str(e)}"
        }


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    lat = request.args.get("lat", 37.7749)
    lng = request.args.get("lng", -122.4194)
    aqi_data = fetch_air_quality(lat, lng)
    
    current_pledges = get_all_pledges()
    total_count = len(current_pledges)
    high_impact_count = sum(1 for p in current_pledges if p.get("impact") == "High Impact")

    initial_ai_advisory = generate_ai_aqi_advisory(
        location_name=aqi_data.get("location_name", "San Francisco, CA"),
        aqi_val=aqi_data.get("aqi", 34),
        category=aqi_data.get("category", "Good"),
        pollutant=aqi_data.get("dominant_pollutant", "PM2.5")
    )

    submitted_pledge = session.pop("submitted_pledge", None)
    ai_analysis = None
    if submitted_pledge:
        location_label = aqi_data.get("location_name", "San Francisco, CA") if aqi_data else "San Francisco, CA"
        ai_analysis = generate_ai_pledge_analysis(
            name=submitted_pledge["name"],
            category=submitted_pledge["category"],
            pledge_text=submitted_pledge["pledge"],
            impact_tier=submitted_pledge["impact"],
            location_name=location_label
        )

    return render_template(
        "index.html",
        pledges=current_pledges,
        aqi=aqi_data,
        ai_advisory=initial_ai_advisory,
        total_pledges=total_count,
        high_impact_pledges=high_impact_count,
        db_status=db_status,
        current_lat=lat,
        current_lng=lng,
        maps_api_key=MAPS_API_KEY,
        submitted_pledge=submitted_pledge,
        ai_analysis=ai_analysis
    )


@app.route("/api/aqi", methods=["GET"])
def api_aqi():
    lat = request.args.get("lat", 37.7749)
    lng = request.args.get("lng", -122.4194)
    data = fetch_air_quality(lat, lng)
    ai_insight = generate_ai_aqi_advisory(
        location_name=data.get("location_name", "this location"),
        aqi_val=data.get("aqi", 0),
        category=data.get("category", "Unknown"),
        pollutant=data.get("dominant_pollutant", "particles")
    )
    data["ai_advisory"] = ai_insight
    return jsonify(data)


@app.route("/api/gemini/recommendations", methods=["POST"])
def api_gemini_recommendations():
    body = request.get_json(silent=True) or {}
    advisory = generate_ai_aqi_advisory(
        location_name=body.get("locationName", "Current Location"),
        aqi_val=body.get("aqiValue", 34),
        category=body.get("aqiCategory", "Good"),
        pollutant=body.get("dominantPollutant", "PM2.5")
    )
    return jsonify({"success": True, "data": advisory})


@app.route("/api/gemini/analyze-pledge", methods=["POST"])
def api_gemini_analyze_pledge():
    body = request.get_json(silent=True) or {}
    analysis = generate_ai_pledge_analysis(
        name=body.get("name", "Participant"),
        category=body.get("category", "Clean Mobility & Anti-Idling"),
        pledge_text=body.get("pledge", ""),
        impact_tier=body.get("impact", "Medium Impact"),
        location_name=body.get("locationName", "San Francisco, CA")
    )
    return jsonify({"success": True, "data": analysis})


@app.route("/pledge", methods=["POST"])
def add_pledge():
    name = request.form.get("name", "Anonymous Changemaker").strip()
    category = request.form.get("category", "Clean Mobility & Anti-Idling")
    pledge_text = request.form.get("pledge", "").strip()
    impact = request.form.get("impact", "Medium Impact")
    submission_id = request.form.get("submission_id", "").strip()

    if pledge_text:
        new_entry = {
            "name": name if name else "Anonymous Changemaker",
            "category": category,
            "pledge": pledge_text,
            "impact": impact,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }
        save_pledge(new_entry, submission_id=submission_id)
        session["submitted_pledge"] = new_entry

    lat = request.form.get("lat", request.args.get("lat", "37.7749"))
    lng = request.form.get("lng", request.args.get("lng", "-122.4194"))
    return redirect(url_for('index', lat=lat, lng=lng))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SDG 13: Climate Action Pledge Tracker & Global Air Quality Map</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        sdg: {
                            green: '#3F7E44',
                            darkgreen: '#2A582E',
                            lightgreen: '#EAF4EC',
                            accent: '#5BB762'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        #map {
            width: 100%;
            height: 380px;
            border-radius: 0.75rem;
        }
        .pac-container {
            z-index: 10000;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            font-family: inherit;
        }
    </style>
</head>
<body class="bg-stone-50 text-stone-800 min-h-screen flex flex-col font-sans antialiased">

    <!-- Top Navigation Header with Google Cloud & Mentor Me Collective Branding -->
    <header class="bg-gradient-to-r from-[#DE6738] via-[#DE6738] to-[#CD582B] text-white shadow-md border-b-4 border-[#1B5D77]">
        <div class="max-w-6xl mx-auto px-4 py-4 space-y-3">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                
                <!-- Left Title -->
                <div class="flex items-center space-x-3 text-center sm:text-left">
                    <div>
                        <h1 class="text-xl font-bold tracking-tight text-white drop-shadow-xs">SDG 13: Climate Action Pledge Tracker</h1>
                        <p class="text-xs text-amber-100 font-medium">Global Air Quality Explorer &bull; Google Maps &bull; Cloud Run &bull; Firestore</p>
                    </div>
                </div>

                <!-- Right: Mentor Me Collective Logo Badge -->
                <div class="flex items-center shadow-md rounded-full overflow-hidden border border-white/50 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2">
                    <img 
                        src="https://storage.googleapis.com/sites_imagex/MentorMeLogo.png" 
                        alt="Mentor Me Collective" 
                        class="h-8 sm:h-10 w-auto object-contain"
                        referrerpolicy="no-referrer"
                    />
                </div>

            </div>

            <!-- Subheader status pill -->
            <div class="space-y-1.5 pt-1 border-t border-white/15">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div class="flex items-center gap-2 text-amber-100 text-[11px]">
                        <span class="inline-block w-2 h-2 rounded-full bg-[#ECC247] animate-pulse"></span>
                        <span>Live Google Maps JavaScript &bull; Google Air Quality API &bull; Google Gemini AI &bull; Firestore /pledges</span>
                    </div>
                    <span class="px-2.5 py-0.5 bg-[#1B5D77]/80 text-white rounded-full text-[10px] font-semibold tracking-wide uppercase border border-white/20 inline-flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                        </svg>
                        <span>Gemini-Powered Climate Action</span>
                    </span>
                </div>
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10.5px] text-sky-100/90 pt-1 border-t border-white/10">
                    <p>Community Air Quality Explorer &bull; Google Gemini AI Advisories &bull; Google Cloud Run &bull; Firestore NoSQL</p>
                    <p>Managed with GCP Console &bull; Google Maps JavaScript API &bull; Google Air Quality API &bull; Google Gemini</p>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">

        <!-- Interactive Global Air Quality Map Section -->
        <section class="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Interactive Map
                        </span>
                        <h2 class="text-base font-bold text-stone-900">Explore World Air Quality</h2>
                    </div>
                    <p class="text-xs text-stone-500 mt-0.5">
                        Click anywhere on the globe or search a city to fetch real-time Google Air Quality API readings.
                    </p>
                </div>

                <!-- Search and Geolocation Controls -->
                <div class="flex flex-wrap items-center gap-2">
                    <form onsubmit="handleManualSearch(event)" class="relative flex items-center min-w-[280px]">
                        <input 
                            id="map-search-input" 
                            type="text" 
                            placeholder="Search continent, country or city (e.g. Africa, Europe, Ghana, Berlin)..." 
                            class="w-full pl-8 pr-16 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                        />
                        <svg class="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <button 
                            type="submit" 
                            class="absolute right-1.5 px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium transition cursor-pointer"
                        >
                            Search
                        </button>
                    </form>
                    <button 
                        id="btn-geolocate"
                        type="button" 
                        class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                        <svg class="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>My Location</span>
                    </button>
                </div>
            </div>

            <!-- Quick Presets: Continents & Cities -->
            <div class="space-y-1.5 pt-1">
                <!-- Continents -->
                <div class="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    <span class="text-indigo-700 font-semibold text-[11px] flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
                        </svg> Continents:
                    </span>
                    <button type="button" onclick="jumpToLocation(1.6508, 17.6879, 'Africa', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">Africa</button>
                    <button type="button" onclick="jumpToLocation(34.0479, 100.6197, 'Asia', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">Asia</button>
                    <button type="button" onclick="jumpToLocation(54.5260, 15.2551, 'Europe', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">Europe</button>
                    <button type="button" onclick="jumpToLocation(54.5260, -105.2551, 'North America', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">North America</button>
                    <button type="button" onclick="jumpToLocation(-8.7832, -55.4915, 'South America', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">South America</button>
                    <button type="button" onclick="jumpToLocation(-22.7359, 140.0188, 'Oceania', 3)" class="px-2 py-0.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-200 text-[11px] font-medium cursor-pointer">Oceania</button>
                </div>

                <!-- Cities -->
                <div class="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    <span class="text-stone-400 font-medium text-[11px]">Popular Cities:</span>
                    <button type="button" onclick="jumpToLocation(37.7749, -122.4194, 'San Francisco, USA', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">San Francisco</button>
                    <button type="button" onclick="jumpToLocation(51.5074, -0.1278, 'London, UK', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">London</button>
                    <button type="button" onclick="jumpToLocation(35.6762, 139.6503, 'Tokyo, Japan', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">Tokyo</button>
                    <button type="button" onclick="jumpToLocation(28.6139, 77.2090, 'New Delhi, India', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">New Delhi</button>
                    <button type="button" onclick="jumpToLocation(-23.5505, -46.6333, 'São Paulo, Brazil', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">São Paulo</button>
                    <button type="button" onclick="jumpToLocation(-1.2921, 36.8219, 'Nairobi, Kenya', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">Nairobi</button>
                    <button type="button" onclick="jumpToLocation(48.8566, 2.3522, 'Paris, France', 11)" class="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded border border-stone-200 text-[11px] cursor-pointer">Paris</button>
                </div>
            </div>

            <!-- The Google Map Canvas -->
            <div class="relative overflow-hidden rounded-xl border border-stone-200">
                <div id="map"></div>

                <!-- Floating Live Inspector Badge on Map -->
                <div id="map-live-badge" class="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-200 p-3 rounded-lg shadow-md max-w-xs text-xs z-10">
                    <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-100">
                        <span id="badge-location-name" class="font-bold text-stone-900 truncate">{{ aqi.location_name }}</span>
                        <span id="badge-aqi-pill" class="px-2 py-0.5 rounded-full text-[10px] font-bold 
                            {% if aqi.category == 'Good' %} bg-emerald-100 text-emerald-800
                            {% elif aqi.category == 'Moderate' %} bg-amber-100 text-amber-800
                            {% else %} bg-rose-100 text-rose-800 {% endif %}">
                            AQI: <span id="badge-aqi-val">{{ aqi.aqi }}</span>
                        </span>
                    </div>
                    <p id="badge-recommendation" class="text-[11px] text-stone-600 mt-1.5 leading-snug">
                        {{ aqi.health_recommendation }}
                    </p>
                    <div class="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                        <span>Dominant: <strong id="badge-pollutant" class="text-stone-700">{{ aqi.dominant_pollutant }}</strong></span>
                        <span id="badge-status-loading" class="hidden text-emerald-600 font-medium">Fetching AQI...</span>
                    </div>
                </div>

                <!-- Floating Zoom Controls -->
                <div class="absolute bottom-4 right-4 flex flex-col bg-white border border-stone-300 rounded-lg shadow-md overflow-hidden z-10">
                    <button type="button" onclick="zoomIn()" title="Zoom In" aria-label="Zoom In" class="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-emerald-700 border-b border-stone-200 font-bold text-base transition cursor-pointer">
                        +
                    </button>
                    <button type="button" onclick="zoomOut()" title="Zoom Out" aria-label="Zoom Out" class="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-emerald-700 font-bold text-base transition cursor-pointer">
                        &minus;
                    </button>
                </div>
            </div>
        </section>

        <!-- Top Air Quality & SDG Metrics Bar -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <!-- Google Air Quality API Summary Card -->
            <div class="md:col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between pb-3 border-b border-stone-100">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Google Air Quality API
                            </span>
                            <span id="summary-location-label" class="text-xs text-stone-500">{{ aqi.location_name }}</span>
                        </div>
                        <span id="summary-live-tag" class="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Google Air Quality API Ready
                        </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 items-center">
                        <div class="flex items-baseline space-x-2">
                            <span id="summary-aqi-num" class="text-4xl font-extrabold text-stone-900">{{ aqi.aqi }}</span>
                            <span class="text-xs font-medium text-stone-500 uppercase">AQI Index</span>
                        </div>
                        <div class="sm:col-span-2">
                            <div id="summary-category-pill" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                {% if aqi.category == 'Good' %} bg-emerald-100 text-emerald-800
                                {% elif aqi.category == 'Moderate' %} bg-amber-100 text-amber-800
                                {% else %} bg-rose-100 text-rose-800 {% endif %}">
                                Status: <span id="summary-category-text">{{ aqi.category }}</span> (<span id="summary-pollutant-text">{{ aqi.dominant_pollutant }}</span>)
                            </div>
                            <p id="summary-rec-text" class="text-xs text-stone-600 mt-1 leading-relaxed">{{ aqi.health_recommendation }}</p>
                        </div>
                    </div>
                </div>

                <!-- Coordinate Filter Form -->
                <div class="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
                    <span class="text-stone-500 font-medium">Selected Coordinates:</span>
                    <input type="number" step="0.0001" id="input-lat" value="{{ current_lat }}" placeholder="Lat" class="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                    <input type="number" step="0.0001" id="input-lng" value="{{ current_lng }}" placeholder="Lng" class="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                    <button type="button" onclick="updateFromInputs()" class="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded font-medium transition cursor-pointer">
                        Update Pin
                    </button>
                    <span id="summary-status-msg" class="text-[11px] text-stone-400 ml-auto">{{ aqi.status_message }}</span>
                </div>
            </div>

            <!-- GCP Infrastructure & Tracker Summary Card -->
            <div class="bg-[#DE6738] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between border border-[#DE6738]/30">
                <div>
                    <div class="flex items-center justify-between">
                        <h2 class="text-xs font-semibold uppercase tracking-wider text-amber-100">GCP Cloud Infrastructure</h2>
                        <span class="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white border border-white/20">Firestore</span>
                    </div>
                    
                    <div class="mt-3 space-y-2">
                        <div class="bg-black/20 p-2.5 rounded-lg border border-white/15 text-xs">
                            <span class="text-amber-100/90 block text-[11px]">Database Layer:</span>
                            <span class="font-semibold text-white">{{ db_status }}</span>
                        </div>

                        <div class="flex items-center justify-between pt-1">
                            <div>
                                <p class="text-2xl font-bold">{{ total_pledges }}</p>
                                <p class="text-[11px] text-amber-100">Documents Stored</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-semibold text-[#FDF3EE]">{{ high_impact_pledges }}</p>
                                <p class="text-[11px] text-amber-200">High-Impact</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="pt-3 border-t border-white/20 text-[11px] text-amber-100 leading-snug">
                    All records are persisted in Firestore Collection: <code class="bg-black/30 px-1 py-0.5 rounded font-mono text-white">/pledges</code> in your GCP project.
                </div>
            </div>
        </section>

        <!-- Dynamic Live AQI Advisory Card -->
        <section id="dynamic-advisory-box" class="rounded-xl border p-5 shadow-sm transition-all duration-300 border-emerald-200 bg-emerald-50/60 text-emerald-950">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/10">
                <div class="flex items-center space-x-2">
                    <span id="advisory-badge" class="px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-300">
                        Optimal Clean Air Day
                    </span>
                    <span class="text-xs font-semibold opacity-80">Localized Recommendations</span>
                </div>
                <span class="text-xs font-mono font-medium">
                    Active AQI: <strong id="advisory-aqi-val">{{ aqi.aqi }}</strong> (<span id="advisory-aqi-cat">{{ aqi.category }}</span>)
                </span>
            </div>

            <h3 id="advisory-headline" class="text-base font-bold mt-3 mb-3">
                Air quality in {{ aqi.location_name }} is clean and fresh (AQI: {{ aqi.aqi }}).
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div class="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-black/5">
                    <div class="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                        <span class="text-emerald-700 font-bold">&#9658;</span> Outdoor Activity
                    </div>
                    <p id="advisory-outdoor" class="text-stone-700 leading-relaxed">
                        Ideal conditions for outdoor sports, cycling, running, and children’s activities.
                    </p>
                </div>

                <div class="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-black/5">
                    <div class="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                        <span class="text-blue-700 font-bold">&#9658;</span> Indoor Air & Windows
                    </div>
                    <p id="advisory-indoor" class="text-stone-700 leading-relaxed">
                        Excellent time to open windows and naturally ventilate home living spaces.
                    </p>
                </div>

                <div class="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-black/5">
                    <div class="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                        <span class="text-indigo-700 font-bold">&#9658;</span> Commute Choice
                    </div>
                    <p id="advisory-commute" class="text-stone-700 leading-relaxed">
                        Take advantage of the fresh air by walking or bicycling for your trips today.
                    </p>
                </div>

                <div class="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-black/5">
                    <div class="font-semibold text-stone-900 flex items-center gap-1.5 mb-1">
                        <span class="text-purple-700 font-bold">&#9658;</span> Direct Action
                    </div>
                    <p id="advisory-action" class="text-stone-700 leading-relaxed">
                        Help keep the air clean: avoid engine idling and support active transit in your neighborhood.
                    </p>
                </div>
            </div>
        </section>

        <!-- City Clean Air Action Toolkit Section -->
        <section class="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <h2 class="text-lg font-bold text-stone-900">City Clean Air Action Toolkit</h2>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            12 High-Impact Practices
                        </span>
                    </div>
                    <p class="text-xs text-stone-500 mt-1">
                        Evidence-based steps you, your household, and your community can take to improve urban air quality.
                    </p>
                </div>

                <!-- Score Meter -->
                <div class="bg-stone-50 border border-stone-200 rounded-lg p-3 min-w-[240px]">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                        <span class="font-semibold text-stone-700">Your Clean Air Score</span>
                        <span id="clean-air-score-val" class="font-mono font-bold text-[#1B5D77]">0/12 (0%)</span>
                    </div>
                    <div class="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div id="clean-air-progress-bar" class="bg-[#1B5D77] h-2 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <!-- Category Filter Buttons -->
            <div class="flex flex-wrap items-center gap-2 pt-4 pb-5">
                <button type="button" onclick="filterToolkit('all')" id="tab-btn-all" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white shadow-sm transition cursor-pointer">
                    All Solutions (12)
                </button>
                <button type="button" onclick="filterToolkit('mobility')" id="tab-btn-mobility" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60 transition cursor-pointer">
                    Cleaner Mobility (4)
                </button>
                <button type="button" onclick="filterToolkit('household')" id="tab-btn-household" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60 transition cursor-pointer">
                    Household & Yard (4)
                </button>
                <button type="button" onclick="filterToolkit('nature')" id="tab-btn-nature" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer">
                    Urban Nature & Trees (3)
                </button>
                <button type="button" onclick="filterToolkit('civic')" id="tab-btn-civic" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/60 transition cursor-pointer">
                    Civic & Community (3)
                </button>
            </div>

            <!-- Action Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <!-- 1. Zero-Idling -->
                <div class="action-card toolkit-mobility rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="mob-1">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128663; Cleaner Mobility</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Immediate Local Relief</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Zero-Idling Habit at Stops & Pickups</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Turn off vehicle engines whenever stopped for more than 10 seconds (school lines, curbside waiting, drive-thrus).</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Eliminates localized PM2.5 and NOx hotspots right at pedestrian and child breathing levels.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('mob-1', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Sustainable Transport', 'High Impact', 'Turn off vehicle engines when stopped for >10 seconds to eliminate idling exhaust in neighborhood zones.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 2. Active Transit -->
                <div class="action-card toolkit-mobility rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="mob-2">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128690; Cleaner Mobility</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">City-Scale Impact</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Active & Shared Transit Commuting</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Replace 1 to 2 solo automobile trips each week with cycling, walking, light rail, bus transit, or organized carpools.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Cuts traffic congestion by up to 20% and prevents ~400 kg of annual tailpipe emissions per commuter.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('mob-2', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Sustainable Transport', 'High Impact', 'Replace at least 2 solo car trips per week with cycling, walking, or electrified public transit.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 3. Eco Driving -->
                <div class="action-card toolkit-mobility rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="mob-3">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#9881; Cleaner Mobility</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">Particulate Reduction</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Eco-Driving & Tire Pressure Optimization</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Keep tires inflated to manufacturer specifications and practice gentle braking to minimize tire and brake pad dust.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Non-exhaust emissions (tire and brake wear) account for over 50% of roadway particulate matter.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('mob-3', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Sustainable Transport', 'Medium Impact', 'Maintain optimal tire inflation and practice gentle braking to reduce roadway particulate dust.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 4. Evening Refueling -->
                <div class="action-card toolkit-mobility rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="mob-4">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128293; Cleaner Mobility</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">Smog Prevention</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Refuel Vehicles After Sunset on Hot Days</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Pump gasoline in the cooler evening hours rather than the middle of hot, sunny days.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Prevents volatile fuel vapors from reacting photochemically in daytime heat to form ground-level ozone smog.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('mob-4', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Sustainable Transport', 'Medium Impact', 'Only refuel gasoline vehicles after sunset during hot weather to reduce daytime photochemical ozone formation.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 5. Electric Yard Tools -->
                <div class="action-card toolkit-household rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="house-1">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#9889; Household & Yard</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Major Emission Cut</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Transition to Electric Yard & Lawn Tools</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Replace 2-stroke gasoline leaf blowers, trimmers, and mowers with modern lithium battery-electric models.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Operating a gas leaf blower for 1 hr emits as much volatile hydrocarbons as driving a passenger car 1,100 miles.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('house-1', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Energy Conservation', 'High Impact', 'Switch all yard maintenance tools to battery-electric to eliminate 2-stroke hydrocarbon exhaust in our neighborhood.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 6. Zero Open Burning -->
                <div class="action-card toolkit-household rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="house-2">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#127968; Household & Yard</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Air Basin Protection</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Eliminate Backyard & Waste Burning</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Never burn yard leaves, branches, trash, or treated wood in open residential fire pits.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Directly prevents dense plumes of black carbon, dioxins, and fine particles that settle in neighboring homes.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('house-2', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Reforestation & Waste', 'High Impact', 'Commit to zero backyard burning of leaves or waste, opting for municipal composting and green waste recycling.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 7. Induction & Heat Pumps -->
                <div class="action-card toolkit-household rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="house-3">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#9889; Household & Yard</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Indoor & Urban Quality</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Switch to Clean Induction & Heat Pumps</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Upgrade from gas ranges and oil heaters to clean magnetic induction cooking and high-efficiency heat pumps.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Dramatically lowers both indoor nitrogen dioxide exposure and building sector combustion emissions.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('house-3', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Energy Conservation', 'High Impact', 'Transition home cooking and heating systems to electric induction cooktops and heat pumps.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 8. Low-VOC Paints -->
                <div class="action-card toolkit-household rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="house-4">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128737; Household & Yard</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">Chemical Smog Shield</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Choose Zero/Low-VOC Paints & Solvents</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Use water-based, zero-VOC paints, adhesives, varnishes, and non-aerosol household cleaning supplies.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Reduces evaporative organic chemical vapors that react with sunlight to create toxic city smog.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('house-4', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Energy Conservation', 'Medium Impact', 'Exclusively purchase zero-VOC paints and eco-certified non-aerosol cleaning products for home maintenance.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 9. Particulate Hedges -->
                <div class="action-card toolkit-nature rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="green-1">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#127795; Urban Nature</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Bio-Filter Barrier</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Plant Particulate-Trapping Foliage & Hedges</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Plant rough-leafed native trees, dense evergreen shrubs, and hedges along perimeter fences.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Dense roadside vegetative buffers physically trap up to 40% of ambient fine particulate dust before it enters homes.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('green-1', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Reforestation & Waste', 'High Impact', 'Plant particulate-filtering native evergreen trees or perimeter hedges to form a biological dust barrier.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 10. Balcony Gardens -->
                <div class="action-card toolkit-nature rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="green-2">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#127793; Urban Nature</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">Microclimate Cooling</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Cultivate Balcony & Rooftop Green Spaces</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Install container plant boxes, balcony green walls, or rooftop gardens in apartment buildings and urban homes.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Cools urban heat island microclimates by 1–3°C and absorbs gaseous airborne pollutants.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('green-2', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Reforestation & Waste', 'Medium Impact', 'Build a container garden or green balcony space to improve local microclimate cooling and biodiversity.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 11. Tree Canopy Equity -->
                <div class="action-card toolkit-nature rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="green-3">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#127795; Urban Nature</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Community Reforestation</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Support Tree Canopy Equity in High-Traffic Zones</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Volunteer with or sponsor neighborhood tree-planting campaigns targeting industrial corridors and transit arterial roads.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Expands shade cover in underserved heat islands and creates enduring air-cleansing urban tree corridors.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('green-3', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Reforestation & Waste', 'High Impact', 'Volunteer with community tree-planting groups to expand the urban forest canopy in dense traffic corridors.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 12. Civic Advocacy -->
                <div class="action-card toolkit-civic rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="civic-1">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128227; Civic Advocacy</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Structural Policy</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Advocate for Low-Emission Zones & Bike Corridors</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Petition municipal leaders for dedicated protected bike highways, pedestrian plazas, and fully electrified city bus fleets.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Transforms city infrastructure to make clean transportation the safest, fastest, and most convenient choice.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('civic-1', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Policy & Advocacy', 'High Impact', 'Advocate in municipal forums for protected bike network expansion, bus electrification, and low-emission zones.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 13. School Clean Air Zones -->
                <div class="action-card toolkit-civic rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="civic-2">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128737; Civic Advocacy</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Protect Children</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Initiate School Clean-Air & No-Idling Zones</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Partner with local schools and PTAs to establish designated idle-free drop-off areas and organize walking school buses.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Shields developing lungs from peak morning and afternoon diesel and gasoline exhaust concentrations.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('civic-2', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Policy & Advocacy', 'High Impact', 'Partner with school communities to enact strict idle-free pickup rules and organize neighborhood walking buses.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

                <!-- 14. Report Violations -->
                <div class="action-card toolkit-civic rounded-xl border p-4 flex flex-col justify-between transition bg-stone-50/70 border-stone-200 hover:border-emerald-300" data-id="civic-3">
                    <div>
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                            <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">&#128227; Civic Advocacy</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">Enforcement Support</span>
                        </div>
                        <h4 class="font-bold text-stone-900 text-sm mt-3 leading-snug">Monitor & Report Industrial/Diesel Violations</h4>
                        <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">Use city 311 apps or environmental hotlines to report excessive commercial diesel truck idling and illegal smoke.</p>
                        <div class="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                            <span class="font-semibold text-emerald-800 text-[11px] block">&#10024; Urban Air Benefit:</span>
                            <p class="text-stone-600 text-[11px]">Holds polluters accountable and supports municipal air quality regulation enforcement.</p>
                        </div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-emerald-700 cursor-pointer font-medium">
                            <input type="checkbox" onchange="toggleToolkitPractice('civic-3', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                            <span>I do this</span>
                        </label>
                        <button type="button" onclick="populatePledgeForm('Policy & Advocacy', 'Medium Impact', 'Use municipal 311 and environmental hotlines to report unpermitted burning and commercial diesel idling violations.')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition cursor-pointer">
                            Pledge This &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </section>

        <!-- Main Workspace: Form + Pledges Feed -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left Column: Submit a Pledge Form & Community Action Blueprint -->
            <div class="lg:col-span-1">
                {% if submitted_pledge %}
                <div class="bg-white rounded-xl border-2 border-emerald-500 shadow-md p-5 space-y-4 text-stone-900 sticky top-6">
                    <div class="bg-gradient-to-r from-emerald-800 to-[#2A582E] text-white p-3.5 rounded-lg flex items-center justify-between gap-2 shadow-inner">
                        <div class="flex items-center gap-2.5">
                            <span class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-emerald-200">✓</span>
                            <div>
                                <h3 class="font-bold text-xs">Pledge Saved to Database</h3>
                                <p class="text-[11px] text-emerald-100">Thank you, <strong>{{ submitted_pledge.name }}</strong>!</p>
                            </div>
                        </div>
                        <a href="/" class="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[11px] font-medium text-white transition">
                            + New Pledge
                        </a>
                    </div>

                    <div class="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs">
                        <div class="flex items-center justify-between gap-1 mb-1">
                            <span class="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                                {{ submitted_pledge.category }}
                            </span>
                            <span class="text-[10px] text-stone-400 font-mono">{{ submitted_pledge.impact }}</span>
                        </div>
                        <p class="text-stone-700 italic">&ldquo;{{ submitted_pledge.pledge }}&rdquo;</p>
                    </div>

                    <div class="space-y-2 text-xs">
                        <div class="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                            <span class="text-emerald-600">✦</span>
                            <h4>Community Action Blueprint For Today</h4>
                        </div>
                        <p class="text-[11px] text-stone-600 leading-relaxed">
                            Immediate instructional steps you can execute in your neighborhood starting today:
                        </p>

                        <div class="space-y-2 pt-1">
                            <div class="border border-stone-200 rounded-lg p-2.5 bg-stone-50/70 space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">Step 1 &bull; Today (First 24h)</span>
                                </div>
                                <p class="text-[11px] text-stone-800 font-medium">Establish your personal anti-emissions routine and setup zero-idling habits in school/curbside pickup lines.</p>
                                <label class="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer">
                                    <input type="checkbox" class="rounded text-emerald-600 focus:ring-emerald-500">
                                    <span>Turn off engine when waiting >10 seconds in pickup zones</span>
                                </label>
                            </div>

                            <div class="border border-stone-200 rounded-lg p-2.5 bg-stone-50/70 space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">Step 2 &bull; This Week (Days 2-7)</span>
                                </div>
                                <p class="text-[11px] text-stone-800 font-medium">Activate your neighborhood and school network with clean air guidelines.</p>
                                <label class="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer">
                                    <input type="checkbox" class="rounded text-emerald-600 focus:ring-emerald-500">
                                    <span>Share an idle-free flyer with local PTA or HOA group</span>
                                </label>
                            </div>

                            <div class="border border-stone-200 rounded-lg p-2.5 bg-stone-50/70 space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">Step 3 &bull; Month 1+</span>
                                </div>
                                <p class="text-[11px] text-stone-800 font-medium">Engage city leadership for clean transit corridors and hyper-local air monitoring.</p>
                                <label class="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer">
                                    <input type="checkbox" class="rounded text-emerald-600 focus:ring-emerald-500">
                                    <span>Submit public comment at municipal transportation hearing</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                        <a href="/" class="w-full py-2 bg-[#3F7E44] hover:bg-[#2A582E] text-white font-semibold rounded-lg text-center transition">
                            Submit Another Clean Air Pledge &rarr;
                        </a>
                    </div>
                </div>
                {% else %}
                <div class="bg-white rounded-xl border border-stone-200 p-6 shadow-sm sticky top-6">
                    <h2 class="text-base font-bold text-stone-900 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#3F7E44]"></span>
                        Make Your Clean Air Pledge
                    </h2>
                    <p class="text-xs text-stone-500 mt-1 mb-5">
                        Commit to actions that reduce urban emissions and protect respiratory health in your city.
                    </p>

                    <form action="/pledge" method="POST" class="space-y-4 text-xs">
                        <div>
                            <label for="name" class="block font-medium text-stone-700 mb-1">Your Name / Organization</label>
                            <input type="text" id="name" name="name" required placeholder="e.g., Alex Rivera" class="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        </div>

                        <div>
                            <label for="category" class="block font-medium text-stone-700 mb-1">Action Category (Air Quality Focus)</label>
                            <select id="category" name="category" class="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-stone-800">
                                <option value="Clean Mobility & Anti-Idling">Clean Mobility & Anti-Idling (Transit, EV, Cycling, Zero-Idling)</option>
                                <option value="Home Energy & Clean Heating">Home Energy & Clean Heating (Heat Pumps, Induction, Efficiency)</option>
                                <option value="Zero Open Burning & Composting">Zero Open Burning & Composting (No Smoke, Yard Mulching)</option>
                                <option value="Urban Greening & Bio-Filters">Urban Greening & Bio-Filters (Particulate Hedges, Green Walls)</option>
                                <option value="Low-VOC & Non-Toxic Products">Low-VOC & Non-Toxic Products (Zero-VOC Paints, Eco-Cleaners)</option>
                                <option value="Civic Clean Air Advocacy">Civic Clean Air Advocacy (School Zones, Bike Corridors, Policy)</option>
                            </select>
                        </div>

                        <div>
                            <label for="impact" class="block font-medium text-stone-700 mb-1">Estimated Impact Tier</label>
                            <select id="impact" name="impact" class="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                                <option value="High Impact">High Impact (Permanent structural or technology transition)</option>
                                <option value="Medium Impact" selected>Medium Impact (Consistent weekly habit adjustment)</option>
                                <option value="Foundational">Foundational (Community awareness & initial steps)</option>
                            </select>
                        </div>

                        <div>
                            <label for="pledge" class="block font-medium text-stone-700 mb-1">Your Specific Clean Air Action</label>
                            <textarea id="pledge" name="pledge" required rows="3" placeholder="e.g., Turn off vehicle engine when waiting at school pickup lines, switch to electric lawn tools, or plant particulate-filtering perimeter hedges." class="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
                        </div>

                        <button type="submit" class="w-full py-2.5 px-4 bg-[#DE6738] hover:bg-[#C85528] text-white font-semibold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-2 cursor-pointer">
                            <span>Save Clean Air Pledge to Firestore</span>
                            <span>&rarr;</span>
                        </button>
                    </form>
                </div>
                {% endif %}
            </div>

            <!-- Right Column: Live Pledges Feed -->
            <div class="lg:col-span-2 space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-bold text-stone-900">Firestore Pledges Stream</h2>
                        <p class="text-xs text-stone-500">Live database records from GCP Firestore collection <code class="text-emerald-700 font-mono">/pledges</code></p>
                    </div>
                    <span class="text-xs text-stone-400">{{ pledges|length }} documents</span>
                </div>

                {% if pledges %}
                <div class="space-y-3">
                    {% for p in pledges %}
                    <div class="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-stone-900 text-sm">{{ p.name }}</span>
                                <span class="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {{ p.category }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2 text-xs">
                                <span class="text-[11px] font-medium px-2 py-0.5 rounded
                                    {% if p.impact == 'High Impact' %} bg-purple-50 text-purple-700 border border-purple-200
                                    {% else %} bg-stone-100 text-stone-600 border border-stone-200 {% endif %}">
                                    {{ p.impact }}
                                </span>
                                <span class="text-stone-400 text-[11px]">{{ p.timestamp }}</span>
                            </div>
                        </div>
                        <p class="text-xs text-stone-700 mt-3 leading-relaxed">
                            &ldquo;{{ p.pledge }}&rdquo;
                        </p>
                        {% if p.id %}
                        <div class="mt-2 pt-2 border-t border-stone-50 flex items-center justify-end">
                            <span class="text-[10px] text-stone-400 font-mono">Doc ID: {{ p.id }}</span>
                        </div>
                        {% endif %}
                    </div>
                    {% endfor %}
                </div>
                {% else %}
                <div class="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center text-stone-500 text-xs">
                    No documents found in Firestore yet. Submit your first climate pledge above!
                </div>
                {% endif %}
            </div>
        </section>

    </main>

    <!-- Branded Footer with Mentor Me Collective Logo -->
    <footer class="bg-[#14475B] text-stone-200 border-t-4 border-[#DE6738] py-6 text-xs mt-12">
        <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
                <p class="font-medium text-white">UN Sustainable Development Goal 13 &bull; Climate Action</p>
                <p class="text-[11px] text-sky-200/80 mt-0.5">Google Cloud Run + Cloud Firestore NoSQL Database &bull; Global Environmental Monitoring</p>
            </div>
            <!-- Mentor Me Collective Footer Logo Badge -->
            <div class="flex items-center shadow-md rounded-full overflow-hidden border border-white/30 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2">
                <img 
                    src="https://storage.googleapis.com/sites_imagex/MentorMeLogo.png" 
                    alt="Mentor Me Collective" 
                    class="h-7 sm:h-9 w-auto object-contain"
                    referrerpolicy="no-referrer"
                />
            </div>
        </div>
    </footer>

    <!-- Google Maps Client Scripts -->
    <script>
        let map;
        let activeMarker;
        let activeInfoWindow;

        function initAppMap() {
            const defaultPos = { lat: {{ current_lat }}, lng: {{ current_lng }} };

            // Initialize Google Map
            map = new google.maps.Map(document.getElementById("map"), {
                center: defaultPos,
                zoom: 10,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                styles: [
                    {
                        featureType: "administrative.country",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#3F7E44" }, { weight: 1 }]
                    }
                ]
            });

            // Initial Marker
            activeMarker = new google.maps.Marker({
                position: defaultPos,
                map: map,
                title: "Selected Location for AQI",
                animation: google.maps.Animation.DROP
            });

            activeInfoWindow = new google.maps.InfoWindow({
                content: \`<div class="p-1 font-sans text-xs"><strong>\${"{{ aqi.location_name }}"}</strong><br>AQI: \${"{{ aqi.aqi }}"} (\${"{{ aqi.category }}"})</div>\`
            });

            activeMarker.addListener("click", () => {
                activeInfoWindow.open(map, activeMarker);
            });

            // Click anywhere on map to fetch AQI
            map.addListener("click", (e) => {
                const clickedLat = e.latLng.lat();
                const clickedLng = e.latLng.lng();
                fetchLocationAQI(clickedLat, clickedLng);
            });

            // Places Autocomplete Setup (Gracefully guarded if Places API is not enabled)
            const searchInput = document.getElementById("map-search-input");
            if (searchInput && google.maps && google.maps.places) {
                try {
                    const autocomplete = new google.maps.places.Autocomplete(searchInput);
                    autocomplete.bindTo("bounds", map);

                    autocomplete.addListener("place_changed", () => {
                        const place = autocomplete.getPlace();
                        if (!place.geometry || !place.geometry.location) {
                            return;
                        }

                        if (place.geometry.viewport) {
                            map.fitBounds(place.geometry.viewport);
                        } else {
                            map.setCenter(place.geometry.location);
                            map.setZoom(12);
                        }

                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();
                        fetchLocationAQI(newLat, newLng, place.name || place.formatted_address);
                    });
                } catch (placesErr) {
                    console.info("Places Autocomplete notice:", placesErr);
                }
            }

            // Geolocation Button
            document.getElementById("btn-geolocate").addEventListener("click", () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLat = position.coords.latitude;
                            const userLng = position.coords.longitude;
                            map.setCenter({ lat: userLat, lng: userLng });
                            map.setZoom(13);
                            fetchLocationAQI(userLat, userLng, "Your Current Location");
                        },
                        () => {
                            alert("Geolocation permission was denied or unavailable.");
                        }
                    );
                } else {
                    alert("Your browser does not support geolocation.");
                }
            });
        }

        // Preset Continent Registry
        const CONTINENT_REGISTRY = {
            'africa': { lat: 1.6508, lng: 17.6879, name: 'Africa', zoom: 3 },
            'asia': { lat: 34.0479, lng: 100.6197, name: 'Asia', zoom: 3 },
            'europe': { lat: 54.5260, lng: 15.2551, name: 'Europe', zoom: 3 },
            'north america': { lat: 54.5260, lng: -105.2551, name: 'North America', zoom: 3 },
            'south america': { lat: -8.7832, lng: -55.4915, name: 'South America', zoom: 3 },
            'oceania': { lat: -22.7359, lng: 140.0188, name: 'Oceania', zoom: 3 },
            'australia': { lat: -25.2744, lng: 133.7751, name: 'Australia', zoom: 4 },
            'antarctica': { lat: -82.8628, lng: 135.0000, name: 'Antarctica', zoom: 2 }
        };

        async function handleManualSearch(e) {
            if (e) e.preventDefault();
            const input = document.getElementById("map-search-input");
            const query = input.value.trim();
            if (!query) return;

            const qLower = query.toLowerCase();
            if (CONTINENT_REGISTRY[qLower]) {
                const c = CONTINENT_REGISTRY[qLower];
                jumpToLocation(c.lat, c.lng, c.name, c.zoom);
                return;
            }

            // Direct fallback to OpenStreetMap Nominatim Geocoder (Free, global, no GCP Geocoding API required)
            fallbackSearch(query);
        }

        async function fallbackSearch(query) {
            try {
                const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query)}&limit=1\`, {
                    headers: { 'Accept-Language': 'en' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lng = parseFloat(data[0].lon);
                        const label = data[0].display_name.split(',').slice(0, 2).join(',').trim();
                        const rank = parseInt(data[0].place_rank || 15);
                        let targetZoom = 11;
                        if (rank <= 4 || data[0].type === 'continent') {
                            targetZoom = 3;
                        } else if (rank <= 8 || data[0].type === 'country') {
                            targetZoom = 5;
                        }
                        map.setCenter({ lat, lng });
                        map.setZoom(targetZoom);
                        fetchLocationAQI(lat, lng, label || query);
                        return;
                    }
                }
            } catch (err) {
                console.warn("Geocoder error:", err);
            }
            alert(\`Could not find "\${query}". Please check the spelling or try another location.\`);
        }

        function jumpToLocation(lat, lng, label, zoom = 11) {
            if (!map) return;
            map.setCenter({ lat, lng });
            map.setZoom(zoom);
            fetchLocationAQI(lat, lng, label);
        }

        function zoomIn() {
            if (!map) return;
            map.setZoom((map.getZoom() || 10) + 1);
        }

        function zoomOut() {
            if (!map) return;
            map.setZoom(Math.max((map.getZoom() || 10) - 1, 1));
        }

        function updateFromInputs() {
            const lat = parseFloat(document.getElementById("input-lat").value);
            const lng = parseFloat(document.getElementById("input-lng").value);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setCenter({ lat, lng });
                fetchLocationAQI(lat, lng);
            }
        }

        async function fetchLocationAQI(lat, lng, customLabel = null) {
            // Update input fields
            document.getElementById("input-lat").value = lat.toFixed(4);
            document.getElementById("input-lng").value = lng.toFixed(4);

            // Move Marker
            const pos = { lat: lat, lng: lng };
            activeMarker.setPosition(pos);

            // Loading indicator
            const loadingSpan = document.getElementById("badge-status-loading");
            if (loadingSpan) loadingSpan.classList.remove("hidden");

            try {
                const response = await fetch(\`/api/aqi?lat=\${lat}&lng=\${lng}\`);
                const data = await response.json();

                const locName = customLabel || data.location_name || \`Lat: \${lat.toFixed(2)}, Lng: \${lng.toFixed(2)}\`;

                // Update floating badge
                document.getElementById("badge-location-name").textContent = locName;
                document.getElementById("badge-aqi-val").textContent = data.aqi;
                document.getElementById("badge-recommendation").textContent = data.health_recommendation;
                document.getElementById("badge-pollutant").textContent = data.dominant_pollutant;

                // Update summary card
                document.getElementById("summary-location-label").textContent = locName;
                document.getElementById("summary-aqi-num").textContent = data.aqi;
                document.getElementById("summary-category-text").textContent = data.category;
                document.getElementById("summary-pollutant-text").textContent = data.dominant_pollutant;
                document.getElementById("summary-rec-text").textContent = data.health_recommendation;
                document.getElementById("summary-status-msg").textContent = data.status_message;

                // Style Category Badge
                const pill = document.getElementById("summary-category-pill");
                const badgePill = document.getElementById("badge-aqi-pill");
                
                let pillClass = "bg-emerald-100 text-emerald-800";
                if (data.category === "Moderate") {
                    pillClass = "bg-amber-100 text-amber-800";
                } else if (data.category && data.category.includes("Unhealthy")) {
                    pillClass = "bg-rose-100 text-rose-800";
                }
                
                pill.className = \`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold \${pillClass}\`;
                badgePill.className = \`px-2 py-0.5 rounded-full text-[10px] font-bold \${pillClass}\`;

                // Update Dynamic AQI Advisory Box
                updateDynamicAdvisory(data.category, data.aqi, locName, data.ai_advisory, data.dominant_pollutant);

                // Update InfoWindow
                activeInfoWindow.setContent(\`
                    <div class="p-1 font-sans text-xs">
                        <strong class="text-stone-900">\${locName}</strong><br>
                        <span class="font-semibold text-emerald-800">AQI: \${data.aqi}</span> (\${data.category})<br>
                        <span class="text-stone-500 text-[10px]">\${data.dominant_pollutant}</span>
                    </div>
                \`);
                activeInfoWindow.open(map, activeMarker);

            } catch (err) {
                console.error("AQI fetch error:", err);
            } finally {
                if (loadingSpan) loadingSpan.classList.add("hidden");
            }
        }

        // --- Clean Air Toolkit JavaScript Handlers ---
        let activeCompletedActions = new Set();

        function filterToolkit(category) {
            const allCards = document.querySelectorAll('.action-card');
            const tabButtons = {
                all: document.getElementById('tab-btn-all'),
                mobility: document.getElementById('tab-btn-mobility'),
                household: document.getElementById('tab-btn-household'),
                nature: document.getElementById('tab-btn-nature'),
                civic: document.getElementById('tab-btn-civic')
            };

            // Reset tab styles
            Object.values(tabButtons).forEach(btn => {
                if (btn) {
                    btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 transition cursor-pointer";
                }
            });

            if (tabButtons[category]) {
                tabButtons[category].className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white shadow-sm transition cursor-pointer";
            }

            allCards.forEach(card => {
                if (category === 'all' || card.classList.contains(\`toolkit-\${category}\`)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }

        function toggleToolkitPractice(id, isChecked) {
            if (isChecked) {
                activeCompletedActions.add(id);
            } else {
                activeCompletedActions.delete(id);
            }
            updateScoreMeter();
        }

        function updateScoreMeter() {
            const count = activeCompletedActions.size;
            const pct = Math.round((count / 12) * 100);
            const valElem = document.getElementById('clean-air-score-val');
            const barElem = document.getElementById('clean-air-progress-bar');
            if (valElem) valElem.textContent = \`\${count}/12 (\${pct}%)\`;
            if (barElem) barElem.style.width = \`\${pct}%\`;
        }

        function populatePledgeForm(category, impact, text) {
            const catSelect = document.getElementById('category');
            const impactSelect = document.getElementById('impact');
            const pledgeArea = document.getElementById('pledge');
            const nameInput = document.getElementById('name');

            if (catSelect) catSelect.value = category;
            if (impactSelect) impactSelect.value = impact;
            if (pledgeArea) pledgeArea.value = text;

            if (nameInput) {
                nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                nameInput.focus();
            }
        }

        async function updateDynamicAdvisory(category, aqi, locationName, aiAdvisory, pollutant) {
            const box = document.getElementById('dynamic-advisory-box');
            const badge = document.getElementById('advisory-badge');
            const aqiVal = document.getElementById('advisory-aqi-val');
            const aqiCat = document.getElementById('advisory-aqi-cat');
            const headline = document.getElementById('advisory-headline');
            const outdoor = document.getElementById('advisory-outdoor');
            const indoor = document.getElementById('advisory-indoor');
            const commute = document.getElementById('advisory-commute');
            const action = document.getElementById('advisory-action');
            const sourceText = document.getElementById('advisory-source-text');

            if (!box) return;

            if (aqiVal) aqiVal.textContent = aqi;
            if (aqiCat) aqiCat.textContent = category;

            const isUnhealthy = category && (category.includes('Unhealthy') || Number(aqi) > 100);
            const isModerate = category === 'Moderate' || (Number(aqi) > 50 && Number(aqi) <= 100);

            if (isUnhealthy) {
                box.className = "rounded-xl border p-5 shadow-sm transition-all duration-300 border-rose-200 bg-rose-50/70 text-rose-950";
                if (badge) {
                    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider bg-rose-100 text-rose-800 border-rose-300";
                    badge.textContent = "High Pollution Alert";
                }
            } else if (isModerate) {
                box.className = "rounded-xl border p-5 shadow-sm transition-all duration-300 border-amber-200 bg-amber-50/70 text-amber-950";
                if (badge) {
                    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider bg-amber-100 text-amber-800 border-amber-300";
                    badge.textContent = "Moderate Air Quality";
                }
            } else {
                box.className = "rounded-xl border p-5 shadow-sm transition-all duration-300 border-emerald-200 bg-emerald-50/60 text-emerald-950";
                if (badge) {
                    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-300";
                    badge.textContent = "Optimal Clean Air Day";
                }
            }

            // If aiAdvisory was already attached in the API payload, apply it directly
            if (aiAdvisory) {
                if (headline && aiAdvisory.headline) headline.textContent = aiAdvisory.headline;
                if (outdoor && aiAdvisory.outdoor) outdoor.textContent = aiAdvisory.outdoor;
                if (indoor && aiAdvisory.indoor) indoor.textContent = aiAdvisory.indoor;
                if (commute && aiAdvisory.commute) commute.textContent = aiAdvisory.commute;
                if (action && aiAdvisory.action) action.textContent = aiAdvisory.action;
                if (sourceText && aiAdvisory.source) sourceText.textContent = aiAdvisory.source;
                return;
            }

            // Otherwise, fetch on-demand recommendations
            try {
                const res = await fetch('/api/gemini/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        locationName: locationName,
                        aqiValue: aqi,
                        aqiCategory: category,
                        dominantPollutant: pollutant || "PM2.5"
                    })
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        const data = json.data;
                        if (headline && data.headline) headline.textContent = data.headline;
                        if (outdoor && (data.outdoor || data.outdoorAdvice)) outdoor.textContent = data.outdoor || data.outdoorAdvice;
                        if (indoor && (data.indoor || data.indoorAdvice)) indoor.textContent = data.indoor || data.indoorAdvice;
                        if (commute && (data.commute || data.commuteAdvice)) commute.textContent = data.commute || data.commuteAdvice;
                        if (action && (data.action || data.actionRecommendation)) action.textContent = data.action || data.actionRecommendation;
                        if (sourceText && data.source) sourceText.textContent = data.source;
                    }
                }
            } catch (e) {
                console.log("[Gemini Client Advisory]", e);
            }
        }
    </script>

    <!-- Load Google Maps JavaScript API with user's key -->
    <script async defer src="https://maps.googleapis.com/maps/api/js?key={{ maps_api_key }}&libraries=places,marker&callback=initAppMap"></script>
</body>
</html>`;

export interface PledgeItem {
  id: string;
  name: string;
  category: string;
  pledge: string;
  impact: string;
  timestamp: string;
}

interface LocationEntry {
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: 'continent' | 'country' | 'city';
  zoom?: number;
  aliases?: string[];
}

// Comprehensive Global Database of Continents, Countries & Major Cities
const GLOBAL_LOCATIONS: LocationEntry[] = [
  // Continents (Full Global Coverage)
  { name: "Africa", country: "Africa", lat: 1.6508, lng: 17.6879, type: "continent", zoom: 3, aliases: ["africa", "african continent"] },
  { name: "Asia", country: "Asia", lat: 34.0479, lng: 100.6197, type: "continent", zoom: 3, aliases: ["asia", "asian continent", "eurasia"] },
  { name: "Europe", country: "Europe", lat: 54.5260, lng: 15.2551, type: "continent", zoom: 3, aliases: ["europe", "european continent", "eu"] },
  { name: "North America", country: "North America", lat: 54.5260, lng: -105.2551, type: "continent", zoom: 3, aliases: ["north america", "na", "americas"] },
  { name: "South America", country: "South America", lat: -8.7832, lng: -55.4915, type: "continent", zoom: 3, aliases: ["south america", "latam", "latin america"] },
  { name: "Oceania", country: "Oceania", lat: -22.7359, lng: 140.0188, type: "continent", zoom: 3, aliases: ["oceania", "australasia", "pacific", "australia continent"] },
  { name: "Antarctica", country: "Antarctica", lat: -82.8628, lng: 135.0000, type: "continent", zoom: 2, aliases: ["antarctica", "south pole"] },

  // Presets & Major Hubs
  { name: "San Francisco, CA, USA", country: "United States", lat: 37.7749, lng: -122.4194, type: "city", zoom: 11, aliases: ["san francisco", "sf", "california", "usa", "united states"] },
  { name: "London, UK", country: "United Kingdom", lat: 51.5074, lng: -0.1278, type: "city", zoom: 11, aliases: ["london", "uk", "england", "great britain", "united kingdom"] },
  { name: "Tokyo, Japan", country: "Japan", lat: 35.6762, lng: 139.6503, type: "city", zoom: 11, aliases: ["tokyo", "japan", "nippon"] },
  { name: "New Delhi, India", country: "India", lat: 28.6139, lng: 77.2090, type: "city", zoom: 11, aliases: ["new delhi", "delhi", "india", "bharat"] },
  { name: "São Paulo, Brazil", country: "Brazil", lat: -23.5505, lng: -46.6333, type: "city", zoom: 11, aliases: ["são paulo", "sao paulo", "brazil", "brasil"] },
  { name: "Nairobi, Kenya", country: "Kenya", lat: -1.2921, lng: 36.8219, type: "city", zoom: 11, aliases: ["nairobi", "kenya"] },
  { name: "Paris, France", country: "France", lat: 48.8566, lng: 2.3522, type: "city", zoom: 11, aliases: ["paris", "france"] },
  
  // Africa
  { name: "Accra, Ghana", country: "Ghana", lat: 5.6037, lng: -0.1870, type: "city", zoom: 11, aliases: ["accra", "ghana"] },
  { name: "Ghana", country: "Ghana", lat: 7.9465, lng: -1.0232, type: "country", zoom: 6, aliases: ["ghana"] },
  { name: "Lagos, Nigeria", country: "Nigeria", lat: 6.5244, lng: 3.3792, type: "city", zoom: 11, aliases: ["lagos", "nigeria"] },
  { name: "Abuja, Nigeria", country: "Nigeria", lat: 9.0765, lng: 7.3986, type: "city", zoom: 11, aliases: ["abuja", "nigeria"] },
  { name: "Nigeria", country: "Nigeria", lat: 9.0820, lng: 8.6753, type: "country", zoom: 6, aliases: ["nigeria"] },
  { name: "Cairo, Egypt", country: "Egypt", lat: 30.0444, lng: 31.2357, type: "city", zoom: 11, aliases: ["cairo", "egypt"] },
  { name: "Egypt", country: "Egypt", lat: 26.8206, lng: 30.8025, type: "country", zoom: 6, aliases: ["egypt"] },
  { name: "Johannesburg, South Africa", country: "South Africa", lat: -26.2041, lng: 28.0473, type: "city", zoom: 11, aliases: ["johannesburg", "joburg", "south africa"] },
  { name: "Cape Town, South Africa", country: "South Africa", lat: -33.9249, lng: 18.4241, type: "city", zoom: 11, aliases: ["cape town", "south africa"] },
  { name: "South Africa", country: "South Africa", lat: -30.5595, lng: 22.9375, type: "country", zoom: 6, aliases: ["south africa"] },
  { name: "Casablanca, Morocco", country: "Morocco", lat: 33.5731, lng: -7.5898, type: "city", zoom: 11, aliases: ["casablanca", "morocco"] },
  { name: "Morocco", country: "Morocco", lat: 31.7917, lng: -7.0926, type: "country", zoom: 6, aliases: ["morocco"] },
  { name: "Addis Ababa, Ethiopia", country: "Ethiopia", lat: 9.0320, lng: 38.7469, type: "city", zoom: 11, aliases: ["addis ababa", "ethiopia"] },
  { name: "Dakar, Senegal", country: "Senegal", lat: 14.7167, lng: -17.4677, type: "city", zoom: 11, aliases: ["dakar", "senegal"] },
  { name: "Kigali, Rwanda", country: "Rwanda", lat: -1.9441, lng: 30.0619, type: "city", zoom: 11, aliases: ["kigali", "rwanda"] },
  { name: "Kampala, Uganda", country: "Uganda", lat: 0.3476, lng: 32.5825, type: "city", zoom: 11, aliases: ["kampala", "uganda"] },
  { name: "Abidjan, Ivory Coast", country: "Ivory Coast", lat: 5.3600, lng: -4.0083, type: "city", zoom: 11, aliases: ["abidjan", "ivory coast", "côte d'ivoire"] },

  // Americas
  { name: "New York, NY, USA", country: "United States", lat: 40.7128, lng: -74.0060, type: "city", zoom: 11, aliases: ["new york", "nyc", "manhattan", "usa"] },
  { name: "Los Angeles, CA, USA", country: "United States", lat: 34.0522, lng: -118.2437, type: "city", zoom: 11, aliases: ["los angeles", "la", "california", "usa"] },
  { name: "Chicago, IL, USA", country: "United States", lat: 41.8781, lng: -87.6298, type: "city", zoom: 11, aliases: ["chicago", "illinois", "usa"] },
  { name: "Miami, FL, USA", country: "United States", lat: 25.7617, lng: -80.1918, type: "city", zoom: 11, aliases: ["miami", "florida", "usa"] },
  { name: "Seattle, WA, USA", country: "United States", lat: 47.6062, lng: -122.3321, type: "city", zoom: 11, aliases: ["seattle", "washington", "usa"] },
  { name: "Toronto, Canada", country: "Canada", lat: 43.6532, lng: -79.3832, type: "city", zoom: 11, aliases: ["toronto", "canada", "ontario"] },
  { name: "Vancouver, Canada", country: "Canada", lat: 49.2827, lng: -123.1207, type: "city", zoom: 11, aliases: ["vancouver", "canada", "bc"] },
  { name: "Canada", country: "Canada", lat: 56.1304, lng: -106.3468, type: "country", zoom: 4, aliases: ["canada"] },
  { name: "Mexico City, Mexico", country: "Mexico", lat: 19.4326, lng: -99.1332, type: "city", zoom: 11, aliases: ["mexico city", "cdmx", "mexico"] },
  { name: "Mexico", country: "Mexico", lat: 23.6345, lng: -102.5528, type: "country", zoom: 5, aliases: ["mexico"] },
  { name: "Buenos Aires, Argentina", country: "Argentina", lat: -34.6037, lng: -58.3816, type: "city", zoom: 11, aliases: ["buenos aires", "argentina"] },
  { name: "Argentina", country: "Argentina", lat: -38.4161, lng: -63.6167, type: "country", zoom: 4, aliases: ["argentina"] },
  { name: "Rio de Janeiro, Brazil", country: "Brazil", lat: -22.9068, lng: -43.1729, type: "city", zoom: 11, aliases: ["rio", "rio de janeiro", "brazil"] },
  { name: "Brazil", country: "Brazil", lat: -14.2350, lng: -51.9253, type: "country", zoom: 4, aliases: ["brazil", "brasil"] },
  { name: "Santiago, Chile", country: "Chile", lat: -33.4489, lng: -70.6693, type: "city", zoom: 11, aliases: ["santiago", "chile"] },
  { name: "Bogota, Colombia", country: "Colombia", lat: 4.7110, lng: -74.0721, type: "city", zoom: 11, aliases: ["bogota", "colombia"] },
  { name: "Lima, Peru", country: "Peru", lat: -12.0464, lng: -77.0428, type: "city", zoom: 11, aliases: ["lima", "peru"] },

  // Europe
  { name: "Berlin, Germany", country: "Germany", lat: 52.5200, lng: 13.4050, type: "city", zoom: 11, aliases: ["berlin", "germany", "deutschland"] },
  { name: "Germany", country: "Germany", lat: 51.1657, lng: 10.4515, type: "country", zoom: 6, aliases: ["germany", "deutschland"] },
  { name: "Madrid, Spain", country: "Spain", lat: 40.4168, lng: -3.7038, type: "city", zoom: 11, aliases: ["madrid", "spain", "españa"] },
  { name: "Spain", country: "Spain", lat: 40.4637, lng: -3.7492, type: "country", zoom: 6, aliases: ["spain", "españa"] },
  { name: "Rome, Italy", country: "Italy", lat: 41.9028, lng: 12.4964, type: "city", zoom: 11, aliases: ["rome", "roma", "italy", "italia"] },
  { name: "Italy", country: "Italy", lat: 41.8719, lng: 12.5674, type: "country", zoom: 6, aliases: ["italy", "italia"] },
  { name: "Amsterdam, Netherlands", country: "Netherlands", lat: 52.3676, lng: 4.9041, type: "city", zoom: 11, aliases: ["amsterdam", "netherlands", "holland"] },
  { name: "Netherlands", country: "Netherlands", lat: 52.1326, lng: 5.2913, type: "country", zoom: 7, aliases: ["netherlands", "holland"] },
  { name: "Stockholm, Sweden", country: "Sweden", lat: 59.3293, lng: 18.0686, type: "city", zoom: 11, aliases: ["stockholm", "sweden"] },
  { name: "Sweden", country: "Sweden", lat: 60.1282, lng: 18.6435, type: "country", zoom: 5, aliases: ["sweden"] },
  { name: "Oslo, Norway", country: "Norway", lat: 59.9139, lng: 10.7522, type: "city", zoom: 11, aliases: ["oslo", "norway"] },
  { name: "Dublin, Ireland", country: "Ireland", lat: 53.3498, lng: -6.2603, type: "city", zoom: 11, aliases: ["dublin", "ireland"] },
  { name: "Lisbon, Portugal", country: "Portugal", lat: 38.7223, lng: -9.1393, type: "city", zoom: 11, aliases: ["lisbon", "portugal"] },
  { name: "Athens, Greece", country: "Greece", lat: 37.9838, lng: 23.7275, type: "city", zoom: 11, aliases: ["athens", "greece"] },
  { name: "Vienna, Austria", country: "Austria", lat: 48.2082, lng: 16.3738, type: "city", zoom: 11, aliases: ["vienna", "austria"] },
  { name: "Brussels, Belgium", country: "Belgium", lat: 50.8503, lng: 4.3517, type: "city", zoom: 11, aliases: ["brussels", "belgium"] },
  { name: "Zurich, Switzerland", country: "Switzerland", lat: 47.3769, lng: 8.5417, type: "city", zoom: 11, aliases: ["zurich", "switzerland"] },
  { name: "Warsaw, Poland", country: "Poland", lat: 52.2297, lng: 21.0122, type: "city", zoom: 11, aliases: ["warsaw", "poland"] },

  // Asia & Oceania & Middle East
  { name: "Beijing, China", country: "China", lat: 39.9042, lng: 116.4074, type: "city", zoom: 11, aliases: ["beijing", "peking", "china"] },
  { name: "Shanghai, China", country: "China", lat: 31.2304, lng: 121.4737, type: "city", zoom: 11, aliases: ["shanghai", "china"] },
  { name: "China", country: "China", lat: 35.8617, lng: 104.1954, type: "country", zoom: 4, aliases: ["china"] },
  { name: "Seoul, South Korea", country: "South Korea", lat: 37.5665, lng: 126.9780, type: "city", zoom: 11, aliases: ["seoul", "south korea", "korea"] },
  { name: "South Korea", country: "South Korea", lat: 35.9078, lng: 127.7669, type: "country", zoom: 6, aliases: ["south korea", "korea"] },
  { name: "Mumbai, India", country: "India", lat: 19.0760, lng: 72.8777, type: "city", zoom: 11, aliases: ["mumbai", "bombay", "india"] },
  { name: "Bengaluru, India", country: "India", lat: 12.9716, lng: 77.5946, type: "city", zoom: 11, aliases: ["bengaluru", "bangalore", "india"] },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, type: "country", zoom: 11, aliases: ["singapore"] },
  { name: "Bangkok, Thailand", country: "Thailand", lat: 13.7563, lng: 100.5018, type: "city", zoom: 11, aliases: ["bangkok", "thailand"] },
  { name: "Jakarta, Indonesia", country: "Indonesia", lat: -6.2088, lng: 106.8456, type: "city", zoom: 11, aliases: ["jakarta", "indonesia"] },
  { name: "Manila, Philippines", country: "Philippines", lat: 14.5995, lng: 120.9842, type: "city", zoom: 11, aliases: ["manila", "philippines"] },
  { name: "Kuala Lumpur, Malaysia", country: "Malaysia", lat: 3.1390, lng: 101.6869, type: "city", zoom: 11, aliases: ["kuala lumpur", "malaysia"] },
  { name: "Hanoi, Vietnam", country: "Vietnam", lat: 21.0285, lng: 105.8542, type: "city", zoom: 11, aliases: ["hanoi", "vietnam"] },
  { name: "Sydney, Australia", country: "Australia", lat: -33.8688, lng: 151.2093, type: "city", zoom: 11, aliases: ["sydney", "australia"] },
  { name: "Melbourne, Australia", country: "Australia", lat: -37.8136, lng: 144.9631, type: "city", zoom: 11, aliases: ["melbourne", "australia"] },
  { name: "Australia", country: "Australia", lat: -25.2744, lng: 133.7751, type: "country", zoom: 4, aliases: ["australia"] },
  { name: "Auckland, New Zealand", country: "New Zealand", lat: -36.8485, lng: 174.7633, type: "city", zoom: 11, aliases: ["auckland", "new zealand"] },
  { name: "Dubai, UAE", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, type: "city", zoom: 11, aliases: ["dubai", "uae", "emirates"] },
  { name: "Riyadh, Saudi Arabia", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, type: "city", zoom: 11, aliases: ["riyadh", "saudi arabia"] },
  { name: "Doha, Qatar", country: "Qatar", lat: 25.2854, lng: 51.5310, type: "city", zoom: 11, aliases: ["doha", "qatar"] },
  { name: "Istanbul, Turkey", country: "Turkey", lat: 41.0082, lng: 28.9784, type: "city", zoom: 11, aliases: ["istanbul", "turkey", "türkiye"] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'files' | 'gcp-console' | 'deploy'>('preview');
  const [activeFile, setActiveFile] = useState<'main.py' | 'requirements.txt' | 'templates/index.html'>('main.py');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Map & Location state
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(10);
  const [markerPos, setMarkerPos] = useState({ lat: 37.7749, lng: -122.4194 });
  const [locationName, setLocationName] = useState('San Francisco, CA');
  const [aqiValue, setAqiValue] = useState(34);
  const [aqiCategory, setAqiCategory] = useState('Good');
  const [dominantPollutant, setDominantPollutant] = useState('PM2.5');
  const [healthRec, setHealthRec] = useState('Air quality is satisfactory with low pollutant concentrations.');
  const [infoOpen, setInfoOpen] = useState(true);

  // Search State & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Firestore pledges list
  const [pledges, setPledges] = useState<PledgeItem[]>([]);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Clean Mobility & Anti-Idling');
  const [formImpact, setFormImpact] = useState('Medium Impact');
  const [formPledge, setFormPledge] = useState('');
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [submittedPledge, setSubmittedPledge] = useState<PledgeItem | null>(null);

  const handleToggleActionCompleted = (id: string) => {
    setCompletedActionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePledgeFromRec = (rec: CleanAirRec) => {
    setSubmittedPledge(null);
    setFormCategory(rec.pledgeCategory);
    setFormImpact(rec.impactTier);
    setFormPledge(rec.pledgeText);

    // Smooth scroll to the pledge form and focus
    setTimeout(() => {
      const nameInput = document.getElementById('mock-name');
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
    }, 50);
  };

  // Handle outside click to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions on query change
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      return;
    }

    const matched = GLOBAL_LOCATIONS.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const countryMatch = item.country.toLowerCase().includes(query);
      const aliasMatch = item.aliases?.some(a => a.toLowerCase().includes(query));
      return nameMatch || countryMatch || aliasMatch;
    }).slice(0, 6);

    setSuggestions(matched);
    setShowSuggestions(matched.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [searchQuery]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAddPledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPledge.trim()) return;

    const newPledge: PledgeItem = {
      id: `doc-${Math.random().toString(36).substring(2, 8)}`,
      name: formName.trim() || 'Anonymous Changemaker',
      category: formCategory,
      pledge: formPledge.trim(),
      impact: formImpact,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
    };

    setPledges([newPledge, ...pledges]);
    setSubmittedPledge(newPledge);
    setFormPledge('');
    setFormName('');
  };

  // Helper to update AQI calculation based on coordinates
  const updateAQIForCoordinates = (lat: number, lng: number, name: string, customZoom?: number) => {
    setMarkerPos({ lat, lng });
    setMapCenter({ lat, lng });
    setLocationName(name);
    if (customZoom !== undefined) {
      setMapZoom(customZoom);
    }

    // Realistic coordinate-based AQI calculation
    const pseudoVal = Math.floor(Math.abs(Math.sin(lat * 3.7 + lng * 2.3) * 75)) + 22;
    setAqiValue(pseudoVal);

    if (pseudoVal < 50) {
      setAqiCategory('Good');
      setDominantPollutant(lat > 20 ? 'PM2.5' : 'NO2');
      setHealthRec('Air quality is satisfactory with low pollutant concentrations. Ideal for outdoor activity.');
    } else if (pseudoVal < 100) {
      setAqiCategory('Moderate');
      setDominantPollutant(lng > 50 ? 'PM10' : 'O3');
      setHealthRec('Acceptable air quality; sensitive groups should consider taking breaks from prolonged outdoor exertion.');
    } else {
      setAqiCategory('Unhealthy for Sensitive Groups');
      setDominantPollutant('PM2.5');
      setHealthRec('Higher particulate matter observed. Sensitive individuals should reduce prolonged outdoor exertion.');
    }
    setInfoOpen(true);
  };

  // Map Click Handler
  const handleMapClick = (e: any) => {
    if (e.detail && e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      updateAQIForCoordinates(lat, lng, `Coordinates: ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    }
  };

  const handleSelectPreset = (preset: LocationEntry) => {
    const zoomLevel = preset.zoom || (preset.type === 'continent' ? 3 : preset.type === 'country' ? 5 : 11);
    updateAQIForCoordinates(preset.lat, preset.lng, preset.name, zoomLevel);
    setSearchQuery('');
    setShowSuggestions(false);
    setSearchError(null);
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updateAQIForCoordinates(lat, lng, "Your Detected Location", 12);
        },
        () => {
          alert('Geolocation permission was denied or unavailable.');
        }
      );
    }
  };

  // Core Search & Geocoding Resolver
  const executeSearch = async (queryToSearch?: string) => {
    const rawQuery = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!rawQuery) return;

    setIsSearching(true);
    setSearchError(null);
    setShowSuggestions(false);

    const normalized = rawQuery.toLowerCase();

    // 1. Check exact or alias match in built-in global database
    const directMatch = GLOBAL_LOCATIONS.find(
      loc => loc.name.toLowerCase() === normalized || 
             loc.country.toLowerCase() === normalized ||
             loc.aliases?.some(a => a.toLowerCase() === normalized)
    );

    if (directMatch) {
      const zoomLevel = directMatch.zoom || (directMatch.type === 'continent' ? 3 : directMatch.type === 'country' ? 5 : 11);
      updateAQIForCoordinates(directMatch.lat, directMatch.lng, directMatch.name, zoomLevel);
      setIsSearching(false);
      setSearchQuery('');
      return;
    }

    // 2. Check partial inclusion match
    const partialMatch = GLOBAL_LOCATIONS.find(
      loc => loc.name.toLowerCase().includes(normalized) ||
             normalized.includes(loc.name.toLowerCase()) ||
             loc.country.toLowerCase().includes(normalized) ||
             loc.aliases?.some(a => normalized.includes(a.toLowerCase()))
    );

    if (partialMatch) {
      const zoomLevel = partialMatch.zoom || (partialMatch.type === 'continent' ? 3 : partialMatch.type === 'country' ? 5 : 11);
      updateAQIForCoordinates(partialMatch.lat, partialMatch.lng, partialMatch.name, zoomLevel);
      setIsSearching(false);
      setSearchQuery('');
      return;
    }

    // 3. Fallback to OpenStreetMap Nominatim Geocoder (Free, global, no GCP Geocoding API activation required)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const nameParts = data[0].display_name.split(',');
          const shortName = nameParts.slice(0, 2).join(',').trim();
          updateAQIForCoordinates(lat, lng, shortName || rawQuery, 10);
          setIsSearching(false);
          setSearchQuery('');
          return;
        }
      }
    } catch (err) {
      console.warn("Nominatim geocoder notice:", err);
    }

    // If no geocoder match, show helpful error
    setIsSearching(false);
    setSearchError(`Could not find "${rawQuery}". Try typing a continent, country or city name (e.g. Africa, Europe, Ghana, Berlin).`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
      handleSelectPreset(suggestions[selectedSuggestionIndex]);
    } else {
      executeSearch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getFileContent = () => {
    switch (activeFile) {
      case 'requirements.txt':
        return REQUIREMENTS_TXT;
      case 'main.py':
        return MAIN_PY;
      case 'templates/index.html':
        return INDEX_HTML;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Navigation & View Switcher */}
      <div className="bg-[#14475B] text-white px-4 py-2.5 border-b border-[#1B5D77] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#ECC247]" />
          <span className="font-bold tracking-wide">SDG 13: Google Maps + Air Quality + Cloud Firestore</span>
          <span className="text-sky-200 hidden sm:inline">&bull; Global Search & Geocoding Active</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            id="tab-preview-btn"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#DE6738] text-white shadow-sm'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Map & Mockup</span>
          </button>
          
          <button
            id="tab-files-btn"
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'files'
                ? 'bg-[#DE6738] text-white shadow-sm'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Source Code (3 Files)</span>
          </button>

          <button
            id="tab-gcp-btn"
            onClick={() => setActiveTab('gcp-console')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'gcp-console'
                ? 'bg-[#DE6738] text-white shadow-sm'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>See in GCP Console</span>
          </button>

          <button
            id="tab-deploy-btn"
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'deploy'
                ? 'bg-[#DE6738] text-white shadow-sm'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Cloud Run Deploy</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* VIEW 1: LIVE INTERACTIVE MAP & MOCKUP */}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-stone-50 flex flex-col">
            
            {/* Branded Header with Google Cloud & Mentor Me Collective Palette */}
            <header className="bg-gradient-to-r from-[#DE6738] via-[#DE6738] to-[#CD582B] text-white shadow-md border-b-4 border-[#1B5D77]">
              <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Left Title */}
                  <div className="flex items-center space-x-3 text-center sm:text-left">
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">SDG 13: Climate Action Pledge Tracker</h1>
                      <p className="text-xs text-amber-100 font-medium">Global Air Quality Explorer &bull; Google Maps &bull; Cloud Run &bull; Firestore</p>
                    </div>
                  </div>

                  {/* Right: Mentor Me Collective Logo Badge */}
                  <div className="flex items-center shadow-md rounded-full overflow-hidden border border-white/50 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2">
                    <img 
                      src="https://storage.googleapis.com/sites_imagex/MentorMeLogo.png" 
                      alt="Mentor Me Collective" 
                      className="h-8 sm:h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                </div>

                {/* Subheader status pill */}
                <div className="space-y-1.5 pt-1 border-t border-white/15">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-100 text-[11px]">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#ECC247] animate-pulse"></span>
                      <span>Live Google Maps JavaScript &bull; Google Air Quality API &bull; Google Gemini AI &bull; Firestore /pledges</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#1B5D77]/80 text-white rounded-full text-[10px] font-semibold tracking-wide uppercase border border-white/20 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Gemini-Powered Climate Action</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10.5px] text-sky-100/90 pt-1 border-t border-white/10">
                    <p>Community Air Quality Explorer &bull; Google Gemini AI Advisories &bull; Google Cloud Run &bull; Firestore NoSQL</p>
                    <p>Managed with GCP Console &bull; Google Maps JavaScript API &bull; Google Air Quality API &bull; Google Gemini</p>
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">

              {/* MAP SECTION */}
              <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Interactive Google Map
                      </span>
                      <h2 className="text-base font-bold text-stone-900">Explore World Air Quality</h2>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Search any continent, country or city, pick a preset, or click anywhere on the globe for instant AQI metrics.
                    </p>
                  </div>

                  {/* Search Bar & Geolocation Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Auto-suggest Search Box Container */}
                    <div ref={searchContainerRef} className="relative min-w-[280px] sm:min-w-[340px]">
                      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                          }}
                          placeholder="Search continent, country, city (e.g. Africa, Europe, Ghana, Berlin)..." 
                          className="w-full pl-8 pr-16 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
                        />
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        
                        <div className="absolute right-1.5 flex items-center space-x-1">
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setShowSuggestions(false);
                                setSearchError(null);
                              }}
                              className="p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            {isSearching ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span>Search</span>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Autocomplete Suggestions Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl z-50 overflow-hidden text-xs max-h-60 overflow-y-auto">
                          <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                            Suggested Locations
                          </div>
                          {suggestions.map((item, index) => (
                            <button
                              key={`${item.name}-${index}`}
                              type="button"
                              onClick={() => handleSelectPreset(item)}
                              onMouseEnter={() => setSelectedSuggestionIndex(index)}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between transition cursor-pointer border-b border-stone-50 last:border-0 ${
                                selectedSuggestionIndex === index 
                                  ? 'bg-emerald-50 text-emerald-900 font-medium' 
                                  : 'hover:bg-stone-50 text-stone-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <MapPin className={`w-3.5 h-3.5 shrink-0 ${
                                  item.type === 'continent' ? 'text-indigo-600' :
                                  item.type === 'country' ? 'text-emerald-700' : 'text-stone-400'
                                }`} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <span className={`text-[10px] uppercase ml-2 shrink-0 font-semibold px-1.5 py-0.5 rounded ${
                                item.type === 'continent' ? 'bg-indigo-100 text-indigo-800' :
                                item.type === 'country' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {item.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Search Error Notice */}
                      {searchError && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg text-[11px] shadow-lg z-50 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{searchError}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={handleGeolocate}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                      <span>My Location</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets: Continents & Major Cities */}
                <div className="space-y-1.5 pt-1">
                  {/* Continents Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    <span className="text-indigo-700 font-semibold text-[11px] flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-600" /> Continents:
                    </span>
                    {GLOBAL_LOCATIONS.filter(l => l.type === 'continent').map((cont) => (
                      <button
                        key={cont.name}
                        onClick={() => handleSelectPreset(cont)}
                        className={`px-2 py-0.5 rounded border text-[11px] font-medium transition cursor-pointer ${
                          locationName === cont.name 
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs' 
                            : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        {cont.name}
                      </button>
                    ))}
                  </div>

                  {/* Cities Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    <span className="text-stone-400 font-medium text-[11px]">Popular Cities:</span>
                    {GLOBAL_LOCATIONS.filter(l => l.type === 'city').slice(0, 7).map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleSelectPreset(city)}
                        className={`px-2 py-0.5 rounded border text-[11px] transition cursor-pointer ${
                          locationName === city.name 
                            ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-xs' 
                            : 'bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 border-stone-200 text-stone-700'
                        }`}
                      >
                        {city.name.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* React Google Maps Canvas */}
                <div className="relative overflow-hidden rounded-xl border border-stone-200 h-[380px] w-full">
                  <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                    <Map
                      center={mapCenter}
                      zoom={mapZoom}
                      onClick={handleMapClick}
                      className="w-full h-full"
                      mapId="DEMO_MAP_ID"
                    >
                      <Marker 
                        position={markerPos} 
                        onClick={() => setInfoOpen(!infoOpen)}
                      />

                      {infoOpen && (
                        <InfoWindow
                          position={markerPos}
                          onCloseClick={() => setInfoOpen(false)}
                        >
                          <div className="p-1 max-w-[200px] text-xs font-sans">
                            <strong className="text-stone-900 block">{locationName}</strong>
                            <div className="flex items-center gap-1 my-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                aqiCategory === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                                aqiCategory === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                AQI: {aqiValue} ({aqiCategory})
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500">{healthRec}</span>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>

                  {/* Floating Map Overlay Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-200 p-3 rounded-lg shadow-md max-w-xs text-xs z-10 pointer-events-auto">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-100">
                      <span className="font-bold text-stone-900 truncate">{locationName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        aqiCategory === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                        aqiCategory === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        AQI: {aqiValue}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1.5 leading-snug">
                      {healthRec}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Dominant: <strong className="text-stone-700">{dominantPollutant}</strong></span>
                      <span className="text-emerald-700 font-medium">Click map to pin</span>
                    </div>
                  </div>

                  {/* Floating Zoom Controls */}
                  <div className="absolute bottom-4 right-4 flex flex-col bg-white border border-stone-300 rounded-lg shadow-md overflow-hidden z-10">
                    <button 
                      type="button" 
                      onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                      title="Zoom In" 
                      aria-label="Zoom In"
                      className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-emerald-700 border-b border-stone-200 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                      title="Zoom Out" 
                      aria-label="Zoom Out"
                      className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-emerald-700 transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Top Air Quality & SDG Metrics Bar */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Air Quality Card */}
                <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Google Air Quality API
                        </span>
                        <span className="text-xs text-stone-500 font-medium">{locationName}</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>API Ready (requests)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 items-center">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-extrabold text-stone-900">{aqiValue}</span>
                        <span className="text-xs font-medium text-stone-500 uppercase">AQI Index</span>
                      </div>
                      <div className="sm:col-span-2">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          aqiCategory === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                          aqiCategory === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Status: {aqiCategory} (Dominant: {dominantPollutant})
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {healthRec}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-stone-500 font-medium flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-600" /> Active Pin:
                    </span>
                    <span className="font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-xs">
                      Lat: {markerPos.lat.toFixed(4)}, Lng: {markerPos.lng.toFixed(4)}
                    </span>
                    <span className="text-[11px] text-stone-400 ml-auto">
                      POST /currentConditions:lookup
                    </span>
                  </div>
                </div>

                {/* Infrastructure & Firestore Card */}
                <div className="bg-[#DE6738] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between border border-[#DE6738]/30">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-100">GCP Cloud Infrastructure</h2>
                      <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white border border-white/20 flex items-center gap-1">
                        <Database className="w-3 h-3 text-amber-200" /> Firestore
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="bg-black/20 p-2.5 rounded-lg border border-white/15 text-xs">
                        <span className="text-amber-100/90 block text-[11px]">Database Layer:</span>
                        <span className="font-semibold text-white">Google Cloud Firestore (Native)</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-2xl font-bold">{pledges.length}</p>
                          <p className="text-[11px] text-amber-100">Documents in Firestore</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-[#FDF3EE]">
                            {pledges.filter(p => p.impact === 'High Impact').length}
                          </p>
                          <p className="text-[11px] text-amber-200">High-Impact</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/20 text-[11px] text-amber-100 leading-snug">
                    Persisted in GCP Firestore Collection: <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-white">/pledges</code>.
                  </div>
                </div>
              </section>

              {/* City Clean Air Action Toolkit & Dynamic Advisory */}
              <CleanAirActionToolkit
                aqiCategory={aqiCategory}
                aqiValue={aqiValue}
                locationName={locationName}
                dominantPollutant={dominantPollutant}
                lat={markerPos.lat}
                lng={markerPos.lng}
                onPledgeAction={handlePledgeFromRec}
                completedActionIds={completedActionIds}
                onToggleActionCompleted={handleToggleActionCompleted}
              />

              {/* Form and Pledges Feed */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Pledge Form & Community Action Blueprint */}
                <div className="lg:col-span-1">
                  {submittedPledge ? (
                    <CommunityActionAnalysisCard
                      pledge={submittedPledge}
                      analysis={getCommunityActionAnalysis(
                        submittedPledge.category,
                        submittedPledge.pledge,
                        submittedPledge.impact,
                        locationName
                      )}
                      locationName={locationName}
                      onResetOrNewPledge={() => setSubmittedPledge(null)}
                    />
                  ) : (
                    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm sticky top-6">
                      <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1B5D77]"></span>
                        Make Your Clean Air Pledge
                      </h2>
                      <p className="text-xs text-stone-500 mt-1 mb-5">
                        Commit to actions that reduce urban emissions and protect respiratory health in your city.
                      </p>

                      <form onSubmit={handleAddPledge} className="space-y-4 text-xs">
                        <div>
                          <label htmlFor="mock-name" className="block font-medium text-stone-700 mb-1">Your Name / Organization</label>
                          <input 
                            id="mock-name"
                            type="text" 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g., Alex Rivera" 
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1B5D77] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="mock-category" className="block font-medium text-stone-700 mb-1">Action Category (Air Quality Focus)</label>
                          <select 
                            id="mock-category"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1B5D77] focus:outline-none bg-white font-medium text-stone-800"
                          >
                            <option value="Clean Mobility & Anti-Idling">Clean Mobility & Anti-Idling (Transit, EV, Cycling, Zero-Idling)</option>
                            <option value="Home Energy & Clean Heating">Home Energy & Clean Heating (Heat Pumps, Induction, Efficiency)</option>
                            <option value="Zero Open Burning & Composting">Zero Open Burning & Composting (No Smoke, Yard Mulching)</option>
                            <option value="Urban Greening & Bio-Filters">Urban Greening & Bio-Filters (Particulate Hedges, Green Walls)</option>
                            <option value="Low-VOC & Non-Toxic Products">Low-VOC & Non-Toxic Products (Zero-VOC Paints, Eco-Cleaners)</option>
                            <option value="Civic Clean Air Advocacy">Civic Clean Air Advocacy (School Zones, Bike Corridors, Policy)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="mock-impact" className="block font-medium text-stone-700 mb-1">Estimated Impact Tier</label>
                          <select 
                            id="mock-impact"
                            value={formImpact}
                            onChange={(e) => setFormImpact(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1B5D77] focus:outline-none bg-white"
                          >
                            <option value="High Impact">High Impact (Permanent structural or technology transition)</option>
                            <option value="Medium Impact">Medium Impact (Consistent weekly habit adjustment)</option>
                            <option value="Foundational">Foundational (Community awareness & initial steps)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="mock-pledge" className="block font-medium text-stone-700 mb-1">Your Specific Clean Air Action</label>
                          <textarea 
                            id="mock-pledge"
                            rows={3} 
                            value={formPledge}
                            onChange={(e) => setFormPledge(e.target.value)}
                            required
                            placeholder="e.g., Turn off vehicle engine when waiting at school pickup lines, switch to electric lawn tools, or plant particulate-filtering perimeter hedges." 
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1B5D77] focus:outline-none"
                          ></textarea>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full py-2.5 px-4 bg-[#DE6738] hover:bg-[#C85528] text-white font-semibold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Save Clean Air Pledge to Firestore</span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right: Pledges Feed */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-stone-900">Firestore Pledges Stream</h2>
                      <p className="text-xs text-stone-500">Live database records from GCP Firestore collection <code className="text-[#1B5D77] font-mono">/pledges</code></p>
                    </div>
                    <span className="text-xs text-stone-400">{pledges.length} documents stored</span>
                  </div>

                  {pledges.length > 0 ? (
                    <div className="space-y-3">
                      {pledges.map((p) => (
                        <div key={p.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-[#1B5D77]/40 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900 text-sm">{p.name}</span>
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#E9F2F5] text-[#1B5D77] border border-[#D4E7ED]">
                                {p.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                p.impact === 'High Impact' 
                                  ? 'bg-[#FDF3EE] text-[#DE6738] border border-[#FBE7DE]' 
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {p.impact}
                              </span>
                              <span className="text-stone-400 text-[11px]">{p.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-700 mt-3 leading-relaxed">
                            &ldquo;{p.pledge}&rdquo;
                          </p>
                          <div className="mt-2 pt-2 border-t border-stone-50 flex items-center justify-end">
                            <span className="text-[10px] text-stone-400 font-mono">Firestore Doc ID: {p.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center text-stone-500 text-xs">
                      No documents found in Firestore yet. Submit your first climate pledge above!
                    </div>
                  )}
                </div>
              </section>

            </main>

            {/* Branded Footer matching Google Cloud & Mentor Me Collective style */}
            <footer className="bg-[#14475B] text-stone-200 border-t-4 border-[#DE6738] py-6 text-xs mt-12">
              <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <span className="text-[11px] text-sky-200/80">
                  SDG 13 Climate Action &bull; Global Environmental Monitoring
                </span>

                {/* Mentor Me Collective Footer Logo Badge */}
                <div className="flex items-center shadow-md rounded-full overflow-hidden border border-white/30 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2">
                  <img 
                    src="https://storage.googleapis.com/sites_imagex/MentorMeLogo.png" 
                    alt="Mentor Me Collective" 
                    className="h-7 sm:h-9 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </footer>

          </div>
        )}

        {/* VIEW 2: CODE FILES */}
        {activeTab === 'files' && (
          <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Python Flask Source Package with GCP Firestore & Google Maps</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Saved under <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono text-emerald-700">/climate_pledge_app/</code> in this workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeFile.replace('templates/', ''), getFileContent())}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {activeFile}</span>
                </button>
                <button
                  onClick={() => handleCopy(getFileContent(), activeFile)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === activeFile ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === activeFile ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-b border-stone-300 pb-2 text-xs">
              <button
                onClick={() => setActiveFile('main.py')}
                className={`px-3 py-1.5 rounded-t-md font-mono font-medium transition cursor-pointer ${
                  activeFile === 'main.py'
                    ? 'bg-emerald-800 text-white shadow'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                main.py (Flask + Firestore + AQI)
              </button>
              <button
                onClick={() => setActiveFile('requirements.txt')}
                className={`px-3 py-1.5 rounded-t-md font-mono font-medium transition cursor-pointer ${
                  activeFile === 'requirements.txt'
                    ? 'bg-emerald-800 text-white shadow'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                requirements.txt
              </button>
              <button
                onClick={() => setActiveFile('templates/index.html')}
                className={`px-3 py-1.5 rounded-t-md font-mono font-medium transition cursor-pointer ${
                  activeFile === 'templates/index.html'
                    ? 'bg-emerald-800 text-white shadow'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                templates/index.html (Google Maps + Tailwind)
              </button>
            </div>

            <div className="bg-stone-900 rounded-xl overflow-hidden shadow-lg border border-stone-800">
              <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono text-emerald-400">{activeFile}</span>
                <span className="text-[11px]">{getFileContent().split('\n').length} lines</span>
              </div>
              <pre className="p-5 text-stone-100 font-mono text-xs overflow-x-auto leading-relaxed max-h-[580px]">
                {getFileContent()}
              </pre>
            </div>
          </div>
        )}

        {/* VIEW 3: SEE IN GCP CONSOLE EXPLANATION & WALKTHROUGH */}
        {activeTab === 'gcp-console' && (
          <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6 text-xs">
            
            {/* Direct Answer Box */}
            <div className="bg-emerald-950 text-white p-6 rounded-xl border border-emerald-800 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Yes! You will see this database directly in your Google Cloud Platform (GCP) Console.</span>
              </div>
              <p className="text-emerald-100 text-xs leading-relaxed">
                When you deploy your Flask application to Google Cloud Run, it writes documents directly into <strong>Google Cloud Firestore (Native Mode)</strong> in your active GCP project. You do not need to host an external database—Firestore is a fully managed, serverless GCP service.
              </p>
            </div>

            {/* Step-by-Step Where to Find It in GCP Console */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-700" />
                Where to Find Your Database in the GCP Console:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">1</span>
                    <span>Open GCP Console</span>
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Navigate to <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">console.cloud.google.com</code> and make sure your project is selected in the top bar.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">2</span>
                    <span>Search "Firestore"</span>
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    In the search bar at the top or the left navigation menu under <strong>Databases</strong>, click on <strong>Firestore Studio</strong> (or <strong>Databases &gt; Firestore</strong>).
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">3</span>
                    <span>Inspect `/pledges`</span>
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Under the <strong>(default)</strong> database, you will see the root collection named <code className="bg-emerald-100 text-emerald-900 font-bold px-1 py-0.5 rounded">pledges</code> containing each submitted document in real time!
                  </p>
                </div>

              </div>
            </div>

            {/* Visual Simulation of Firestore Studio */}
            <div className="bg-stone-900 text-stone-100 rounded-xl overflow-hidden shadow-lg border border-stone-800">
              <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-stone-400 font-mono ml-2">Google Cloud Console &gt; Firestore Studio &gt; Data</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Database: (default) [Native mode]</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-800 text-xs">
                
                {/* Column 1: Collections */}
                <div className="p-4 space-y-3 bg-stone-900/50">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Collections</span>
                  <div className="bg-emerald-900/40 border border-emerald-700/60 rounded-lg p-2.5 flex items-center justify-between text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" />
                      <span className="font-mono font-bold">pledges</span>
                    </div>
                    <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded">{pledges.length} docs</span>
                  </div>
                </div>

                {/* Column 2: Documents */}
                <div className="p-4 space-y-3 bg-stone-900/80">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Documents</span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {pledges.map((doc, i) => (
                      <div key={doc.id} className={`p-2 rounded border ${i === 0 ? 'bg-stone-800 border-emerald-500/50 text-white' : 'bg-stone-950/40 border-stone-800 text-stone-400'}`}>
                        <div className="truncate">{doc.id}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5 font-sans truncate">{doc.name} &bull; {doc.category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Fields */}
                <div className="p-4 space-y-3 bg-stone-950">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Fields (doc-7x92kf)</span>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="bg-stone-900 p-2 rounded border border-stone-800">
                      <span className="text-emerald-400">category</span>: <span className="text-amber-300">"Energy Conservation"</span>
                    </div>
                    <div className="bg-stone-900 p-2 rounded border border-stone-800">
                      <span className="text-emerald-400">impact</span>: <span className="text-purple-300">"High Impact"</span>
                    </div>
                    <div className="bg-stone-900 p-2 rounded border border-stone-800">
                      <span className="text-emerald-400">name</span>: <span className="text-amber-300">"Elena Rostova"</span>
                    </div>
                    <div className="bg-stone-900 p-2 rounded border border-stone-800">
                      <span className="text-emerald-400">pledge</span>: <span className="text-stone-300">"Transition household lighting to 100% LED..."</span>
                    </div>
                    <div className="bg-stone-900 p-2 rounded border border-stone-800">
                      <span className="text-emerald-400">created_at</span>: <span className="text-sky-300">timestamp (August 15, 2026...)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Firestore Creation Guide */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900">If you haven't enabled Firestore in your GCP project yet:</h4>
              <p className="text-stone-600 text-xs leading-relaxed">
                Run this single command in Cloud Shell or Cloud SDK terminal to initialize Firestore in Native mode:
              </p>
              <div className="bg-stone-900 text-stone-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
                <span>gcloud firestore databases create --location=us-central1 --type=firestore-native</span>
                <button
                  onClick={() => handleCopy('gcloud firestore databases create --location=us-central1 --type=firestore-native', 'cmd-create-fs')}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-emerald-400 rounded text-[11px] font-sans font-medium transition cursor-pointer"
                >
                  {copiedKey === 'cmd-create-fs' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: CLOUD RUN DEPLOYMENT INSTRUCTIONS */}
        {activeTab === 'deploy' && (
          <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6 text-xs">
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900">One-Command Cloud Run Deployment</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                Deploy your Flask application directly to Google Cloud Run from source. Cloud Run automatically builds the container and connects to Firestore using default project credentials.
              </p>

              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
                  <span>Terminal (Run in /climate_pledge_app/ directory)</span>
                  <button
                    onClick={() => handleCopy('gcloud run deploy climate-pledge-tracker --source . --region us-central1 --allow-unauthenticated --set-env-vars AIR_QUALITY_API_KEY=YOUR_KEY,GOOGLE_MAPS_API_KEY=AIzaSyAim-mNEJnz1YP0PS4MeQ62QZFTCCGGQRY', 'cmd-deploy')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-sans font-medium transition cursor-pointer"
                  >
                    {copiedKey === 'cmd-deploy' ? 'Copied!' : 'Copy Command'}
                  </button>
                </div>
                <div className="text-emerald-400 overflow-x-auto py-1">
                  gcloud run deploy climate-pledge-tracker \<br />
                  &nbsp;&nbsp;--source . \<br />
                  &nbsp;&nbsp;--region us-central1 \<br />
                  &nbsp;&nbsp;--allow-unauthenticated \<br />
                  &nbsp;&nbsp;--set-env-vars AIR_QUALITY_API_KEY="YOUR_KEY",GOOGLE_MAPS_API_KEY="AIzaSyAim-mNEJnz1YP0PS4MeQ62QZFTCCGGQRY"
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
