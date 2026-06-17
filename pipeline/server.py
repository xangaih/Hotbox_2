# server.py
import json
import os
import subprocess
import sys
import threading
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

PIPELINE_DIR    = Path(__file__).parent
OUTPUT_PATH     = PIPELINE_DIR / "output.json"
PROSPECTED_PATH = PIPELINE_DIR.parent / "prospected_leads.json"
PROSPECTOR_DIR  = PIPELINE_DIR.parent / "prospector"

# Track pipeline run state
pipeline_state: dict = {"running": False, "progress": "", "done": 0, "total": 0}

# Track prospector run state
prospector_state: dict = {"running": False, "progress": "", "username": ""}


class ProspectRequest(BaseModel):
    username: str


@app.get("/leads")
def get_leads():
    result = {}
    # Pipeline output (scored leads)
    if OUTPUT_PATH.exists():
        try:
            result.update(json.load(open(OUTPUT_PATH)))
        except Exception:
            pass
    # Prospected cold leads (separate file)
    if PROSPECTED_PATH.exists():
        try:
            result.update(json.load(open(PROSPECTED_PATH)))
        except Exception:
            pass
    return result


@app.get("/status")
def get_status():
    return pipeline_state


@app.post("/run")
def run_pipeline():
    if pipeline_state["running"]:
        raise HTTPException(status_code=409, detail="Pipeline is already running")

    def _run():
        pipeline_state["running"] = True
        pipeline_state["progress"] = "Starting..."
        pipeline_state["done"] = 0
        pipeline_state["total"] = 0

        leads_path    = str(PIPELINE_DIR.parent / "leads.json")
        business_path = str(PIPELINE_DIR.parent / "business.json")
        out_path      = str(OUTPUT_PATH)

        # Count total leads upfront for progress
        try:
            with open(leads_path) as f:
                pipeline_state["total"] = len(json.load(f))
        except Exception:
            pass

        proc = subprocess.Popen(
            [sys.executable, "-u", "run.py",
             "--leads", leads_path,
             "--business", business_path,
             "--out", out_path],
            cwd=str(PIPELINE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        for line in proc.stdout:
            line = line.rstrip()
            print(line)
            if line.startswith("["):
                # e.g. "[3/25] Processing username..."
                pipeline_state["progress"] = line
                try:
                    done_str = line.split("/")[0].lstrip("[")
                    pipeline_state["done"] = int(done_str)
                except ValueError:
                    pass
            elif line.startswith("Done."):
                pipeline_state["progress"] = line

        proc.wait()
        pipeline_state["running"] = False
        pipeline_state["progress"] = "Done" if proc.returncode == 0 else "Error"

    threading.Thread(target=_run, daemon=True).start()
    return {"status": "started"}


@app.get("/prospect/status")
def get_prospect_status():
    return prospector_state


@app.post("/prospect")
def run_prospect(payload: ProspectRequest):
    username = payload.username.strip().lstrip("@")
    if not username:
        raise HTTPException(status_code=400, detail="username is required")
    if prospector_state["running"]:
        raise HTTPException(status_code=409, detail="Prospector is already running")

    def _run():
        prospector_state["running"]  = True
        prospector_state["progress"] = f"Prospecting @{username}..."
        prospector_state["username"] = username

        proc = subprocess.Popen(
            [sys.executable, "-u", "prospector.py", "--username", username],
            cwd=str(PROSPECTOR_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env={**os.environ},
        )

        for line in proc.stdout:
            line = line.rstrip()
            print(line)
            prospector_state["progress"] = line

        proc.wait()
        prospector_state["running"]  = False
        prospector_state["progress"] = (
            "Done" if proc.returncode == 0 else f"Error (exit {proc.returncode})"
        )

    threading.Thread(target=_run, daemon=True).start()
    return {"status": "started", "username": username}
