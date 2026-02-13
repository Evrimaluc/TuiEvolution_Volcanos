from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import simulation_logic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VolcanoRequest(BaseModel):
    name: str
    elevation: float
    location: dict

@app.post("/calculate")
async def calculate(data: VolcanoRequest):
    # Simülasyonu çağır
    results = simulation_logic.run_full_simulation(data.elevation, data.name)
    return results