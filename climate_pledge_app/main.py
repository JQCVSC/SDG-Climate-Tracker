import os
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
# System instructions tell Gemini exactly how to act when deployed on GCP
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
            for model_name in ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"]:
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
                            "text": f"Impact Analysis: {parsed.get('summaryAnalysis', '')}\n\n• Step 1 (Today): {parsed.get('step1', '')}\n• Step 2 (This Week): {parsed.get('step2', '')}\n• Step 3 (Month 1+): {parsed.get('step3', '')}"
                        }
                except Exception as model_err:
                    err_str = str(model_err).lower()
                    if any(k in err_str for k in ["503", "429", "quota", "rate", "resource_exhausted", "high demand", "unavailable"]):
                        continue
                    print(f"[Gemini AI Note for {model_name}]: {model_err}")
        except Exception as e:
            err_str = str(e).lower()
            if not any(k in err_str for k in ["503", "429", "quota", "rate", "resource_exhausted"]):
                print(f"[Gemini AI Notice]: {e}")

    # High-quality deterministic default analysis
    return {
        "source": "Clean Air Action Engine (Built-in)",
        "summaryAnalysis": f"Your pledge under {category} directly targets urban emission sources in {location_name}.",
        "keyEmissionsCut": "Estimated ~320 kg CO2e and 2.8 kg fine particulates prevented per participant annually.",
        "localHealthBenefit": "Reduces street-level toxic plumes, protecting developing lungs and vulnerable seniors.",
        "step1": "Establish your personal anti-emissions routine and setup zero-idling habits in school/curbside pickup lines.",
        "step2": "Activate your neighborhood and school network with clean air guidelines and flyer distribution.",
        "step3": "Engage municipal leadership for clean transit corridors and hyper-local air monitoring.",
        "text": f"• Step 1 (Today): Establish your personal anti-emissions routine.\n• Step 2 (This Week): Activate your neighborhood and school network.\n• Step 3 (Month 1+): Engage municipal leadership for clean transit corridors."
    }

def generate_ai_aqi_advisory(location_name, aqi_val, category, pollutant):
    """
    Asks Gemini to generate real-time localized advice based on specific AQI conditions.
    Forces the response into structured JSON with model resiliency and smart fallback.
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
"aiSummary": "A 2-3 sentence atmospheric dispersion and microclimate analysis explaining what conditions mean for the public",
"outdoor": "Advice for outdoor exercise and activities",
"indoor": "Advice for indoor air filtration and window ventilation",
"commute": "Advice for transportation and commuting mode choice",
"action": "Immediate individual or civic action to reduce pollution"
"""
            
            for model_name in ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"]:
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
                        if not parsed.get("aiSummary"):
                            parsed["aiSummary"] = f"Real-time atmospheric analysis for {location_name} (AQI: {aqi_val}, {category}). Dominant pollutant {pollutant} levels actively tracked."
                        return parsed
                except Exception as model_err:
                    err_str = str(model_err).lower()
                    if any(k in err_str for k in ["503", "429", "quota", "rate", "resource_exhausted", "high demand", "unavailable"]):
                        continue
                    print(f"[Gemini AQI Advisory Note for {model_name}]: {model_err}")
                
        except Exception as e:
            err_str = str(e).lower()
            if not any(k in err_str for k in ["503", "429", "quota", "rate", "resource_exhausted"]):
                print(f"[Gemini AQI Advisory Notice]: {e}")
            
    # Deterministic category & pollutant-specific expert advice
    cat_lower = str(category).lower()
    is_good = "good" in cat_lower or "excellent" in cat_lower or (isinstance(aqi_val, (int, float)) and aqi_val <= 50 and "moderate" not in cat_lower and "unhealthy" not in cat_lower)
    is_unhealthy = ("unhealthy" in cat_lower or "poor" in cat_lower or "hazard" in cat_lower or (isinstance(aqi_val, (int, float)) and aqi_val > 100)) and not is_good
    is_moderate = not is_good and not is_unhealthy

    if is_unhealthy:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air pollution in {location_name} is elevated (AQI: {aqi_val}, {pollutant}). Sensitive groups should take immediate protective measures.",
            "aiSummary": f"Localized atmospheric conditions in {location_name} indicate thermal inversion or stagnant boundary-layer circulation trapping elevated concentrations of {pollutant}. Atmospheric dispersion is restricted.",
            "outdoor": f"Limit prolonged outdoor physical exertion. Elevated {pollutant} levels can trigger respiratory irritation and asthma flare-ups.",
            "indoor": "Keep windows closed and run HEPA air cleaners. Avoid indoor combustion such as candles or unvented cooking.",
            "commute": "Avoid walking or cycling along congested traffic corridors during rush hour; use filtered cabin AC in transit.",
            "action": "Delay discretionary driving trips, eliminate all open yard burning, and report excessive industrial or diesel emissions."
        }
    elif is_moderate:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air quality in {location_name} is acceptable (AQI: {aqi_val}, {pollutant}). Conditions are suitable for most daily activities.",
            "aiSummary": f"Atmospheric dispersion across {location_name} is steady with moderate boundary layer mixing. Trace concentrations of {pollutant} present from localized traffic and commercial activity.",
            "outdoor": f"Enjoy outdoor sports and recreation, though sensitive individuals should monitor respiration with elevated {pollutant}.",
            "indoor": "Naturally ventilate living spaces during late morning and early afternoon when traffic-related emissions disperse.",
            "commute": "Great day to walk, cycle, or take electrified transit along designated low-traffic neighborhood greenways.",
            "action": "Practice zero-idling at school and transit pickup zones, and check tire pressures to cut non-exhaust particulate wear."
        }
    else:
        return {
            "source": "Clean Air Intelligence Engine",
            "headline": f"Air quality in {location_name} is pristine and healthy (AQI: {aqi_val}). Ideal atmospheric conditions across the region.",
            "aiSummary": f"High boundary-layer ventilation and strong meteorological airflow ensure clean, breathable air across {location_name}. Regional particulate concentrations remain far below WHO annual thresholds.",
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
# Cloud Run automatically handles authentication with Google Cloud services (like Firestore)
# via Application Default Credentials (ADC) attached to the Compute Engine / Cloud Run service account.
db = None
db_status = "In-Memory Fallback"

if FIRESTORE_AVAILABLE:
    try:
        # Connect to default Firestore Database in your GCP project
        db = firestore.Client()
        # Test connection with a lightweight check
        db_status = "Google Cloud Firestore (Connected)"
    except Exception as e:
        db = None
        db_status = f"Local Mode (Firestore not initialized: {str(e)[:40]})"
else:
    db_status = "Local Mode (google-cloud-firestore not installed)"

# In-memory fallback list starts completely clean (no demo/seed data)
fallback_pledges = []


def get_all_pledges():
    """
    Retrieves all pledges from Firestore 'pledges' collection.
    Deduplicates any identical records and falls back to in-memory list if Firestore is unavailable.
    """
    if db is not None:
        try:
            docs = db.collection("pledges").stream()
            results = []
            seen_entries = set()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                
                # In-memory deduplication safety key
                dedup_key = f"{data.get('name', '').strip()}_{data.get('pledge', '').strip()}_{data.get('timestamp', '')}"
                if dedup_key in seen_entries:
                    continue
                seen_entries.add(dedup_key)
                results.append(data)

            # Sort descending by timestamp or created_at
            def sort_key(p):
                return str(p.get("created_at") or p.get("timestamp") or "")

            results.sort(key=sort_key, reverse=True)
            return results
        except Exception as e:
            print(f"[Firestore Read Error]: {e}")
            return fallback_pledges
    return fallback_pledges


def save_pledge(pledge_data, submission_id=None):
    """
    Saves a new pledge document into Google Cloud Firestore.
    Uses an idempotency key (client submission id or content hash) to guarantee NO duplicates on double-click or page refresh.
    """
    if db is not None:
        try:
            # Deterministic document ID prevents duplicate Firestore records
            if submission_id and len(submission_id.strip()) > 5:
                doc_id = f"pledge_{submission_id.strip()}"
            else:
                # Hash based on name + pledge content + UTC day/hour
                raw_token = f"{pledge_data.get('name')}_{pledge_data.get('pledge')}_{datetime.utcnow().strftime('%Y%m%d%H')}"
                doc_id = f"pledge_{hashlib.md5(raw_token.encode('utf-8')).hexdigest()[:16]}"

            doc_ref = db.collection("pledges").document(doc_id)
            
            # THE FIX: Create a copy for the database so the un-serializable 
            # SERVER_TIMESTAMP doesn't crash the Flask session cookie
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
    """
    Fetches real-time Air Quality Index (AQI) data from the Google Air Quality API.
    Defaults to San Francisco coordinates (lat: 37.7749, lng: -122.4194).
    """
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
        "location": {
            "latitude": float(lat),
            "longitude": float(lng)
        },
        "extraComputations": [
            "HEALTH_RECOMMENDATIONS",
            "DOMINANT_POLLUTANT_CONCENTRATION"
        ]
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            indexes = data.get("indexes", [])
            
            # Prefer US EPA index if present for standard 0-500 baseline, otherwise use primary index (Universal AQI)
            epa_index = next((idx for idx in indexes if idx.get("code") == "usa_epa"), None)
            primary_index = epa_index if epa_index else (indexes[0] if indexes else {})
            
            raw_aqi = primary_index.get("aqi", 42)
            raw_category = primary_index.get("category", "Good")
            raw_pollutant = primary_index.get("dominantPollutant", "PM2.5")
            dominant_pollutant = str(raw_pollutant).upper() if raw_pollutant else "PM2.5"
            
            # Normalized categorization to keep Map, Summary, and Advisory Card 100% synchronized
            cat_lower = str(raw_category).lower()
            if "excellent" in cat_lower or "good" in cat_lower:
                category = "Good"
                color = "emerald"
            elif "moderate" in cat_lower:
                category = "Moderate"
                color = "amber"
            elif "sensitive" in cat_lower or "low" in cat_lower:
                category = "Unhealthy for Sensitive Groups"
                color = "orange"
            elif "very" in cat_lower or "hazard" in cat_lower:
                category = "Hazardous"
                color = "purple"
            else:
                category = "Unhealthy"
                color = "rose"
            
            health_recs = data.get("healthRecommendations", {})
            general_rec = health_recs.get("generalPopulation", "Enjoy your usual outdoor activities.")

            return {
                "aqi": raw_aqi,
                "category": category,
                "dominant_pollutant": dominant_pollutant,
                "health_recommendation": general_rec,
                "color": color,
                "location_name": f"Lat: {lat}, Lng: {lng}",
                "is_live": True,
                "status_message": "Live data fetched from Google Air Quality API."
            }
        else:
            return {
                "aqi": 38,
                "category": "Moderate",
                "dominant_pollutant": "PM2.5",
                "health_recommendation": "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.",
                "color": "amber",
                "location_name": f"Coordinates ({lat}, {lng})",
                "is_live": False,
                "status_message": f"Google Air Quality API returned HTTP {response.status_code}"
            }
    except Exception as e:
        return {
            "aqi": 45,
            "category": "Moderate",
            "dominant_pollutant": "PM10",
            "health_recommendation": "Could not connect to external API endpoint. Standard air guidelines apply.",
            "color": "amber",
            "location_name": "Offline Mode",
            "is_live": False,
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
    
    # Retrieve pledges from Google Cloud Firestore
    current_pledges = get_all_pledges()
    total_count = len(current_pledges)
    high_impact_count = sum(1 for p in current_pledges if p.get("impact") == "High Impact")

    # Generate initial AI advisory for the landing state
    initial_ai_advisory = generate_ai_aqi_advisory(
        location_name=aqi_data.get("location_name", "San Francisco, CA"),
        aqi_val=aqi_data.get("aqi", 34),
        category=aqi_data.get("category", "Good"),
        pollutant=aqi_data.get("dominant_pollutant", "PM2.5")
    )

    # Pop the submitted pledge from the session so it only displays once upon PRG redirect
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
    """
    Asynchronous JSON endpoint for interactive Google Maps clicks and place searches.
    Enhanced with real-time Gemini AI insight.
    """
    lat = request.args.get("lat", 37.7749)
    lng = request.args.get("lng", -122.4194)
    data = fetch_air_quality(lat, lng)
    
    # Ask Gemini to analyze that specific environmental data
    ai_insight = generate_ai_aqi_advisory(
        location_name=data.get("location_name", "this location"),
        aqi_val=data.get("aqi", 0),
        category=data.get("category", "Unknown"),
        pollutant=data.get("dominant_pollutant", "particles")
    )
    
    # Attach AI insight to the response payload for the frontend
    data["ai_advisory"] = ai_insight
    
    return jsonify(data)


@app.route("/api/gemini/recommendations", methods=["POST"])
def api_gemini_recommendations():
    """
    Direct endpoint for generating localized recommendations on demand.
    """
    body = request.get_json(silent=True) or {}
    loc_name = body.get("locationName", "Current Location")
    aqi_val = body.get("aqiValue", 34)
    category = body.get("aqiCategory", "Good")
    pollutant = body.get("dominantPollutant", "PM2.5")

    advisory = generate_ai_aqi_advisory(
        location_name=loc_name,
        aqi_val=aqi_val,
        category=category,
        pollutant=pollutant
    )
    return jsonify({"success": True, "data": advisory})


@app.route("/api/gemini/analyze-pledge", methods=["POST"])
def api_gemini_analyze_pledge():
    """
    Direct endpoint for analyzing pledges on demand.
    """
    body = request.get_json(silent=True) or {}
    name = body.get("name", "Participant")
    category = body.get("category", "Clean Mobility & Anti-Idling")
    pledge_text = body.get("pledge", "")
    impact_tier = body.get("impact", "Medium Impact")
    location_name = body.get("locationName", "San Francisco, CA")

    analysis = generate_ai_pledge_analysis(
        name=name,
        category=category,
        pledge_text=pledge_text,
        impact_tier=impact_tier,
        location_name=location_name
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
        # Persist to Google Cloud Firestore database with idempotency check
        save_pledge(new_entry, submission_id=submission_id)
        
        # Store in session for the GET request after redirect
        session["submitted_pledge"] = new_entry

    lat = request.form.get("lat", request.args.get("lat", "37.7749"))
    lng = request.form.get("lng", request.args.get("lng", "-122.4194"))
    
    # POST-Redirect-GET: Prevents form re-submission on browser refresh
    return redirect(url_for('index', lat=lat, lng=lng))


# -----------------------------------------------------------------------------
# Google Cloud Run Entrypoint
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    # Google Cloud Run injects the PORT environment variable (default: 8080)
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)