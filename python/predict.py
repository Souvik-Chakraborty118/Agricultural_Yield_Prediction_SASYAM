import json
import os
import sys
import warnings
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:
    tomllib = None

warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
SECRETS_FILE = MODEL_DIR / ".streamlit" / "secrets.toml"

MODEL_FILE = "crop_group_models_v4.pkl"
SCALER_FILE = "crop_group_scalers_v4.pkl"
LOOKUP_FILE = "crop_group_lookup_v4.pkl"
ENCODER_FILE = "target_encoder_v3.pkl"
FEATURE_FILE = "feature_names_v3.pkl"
KERAS_FILE = "sasyam_ann_v1.keras"
CSV_FILE = "sasyam_super_dataset845v.csv"
LEGACY_CSV_FILE = "smogn_augmented_clean_v2.csv"

# Updated with Official CCEA 2026-27 Marketing Season MSPs
MSP_DB = {
    # --- Official 2026-27 Kharif & Rabi MSPs ---
    "Paddy": 2441, "Rice": 2441, "Wheat": 2585, "Maize": 2410,
    "Bajra": 2900, "Jowar": 4023, "Ragi": 5205, "Barley": 2150,
    "Arhar/Tur": 8450, "Moong(Green Gram)": 8780, "Urad": 8200, 
    "Gram": 5875, "Masoor": 7000, 
    "Groundnut": 7517, "Soyabean": 5708, "Sunflower": 8343, 
    "Rapeseed &Mustard": 6200, "Sesamum": 10346, "Niger seed": 10052, 
    "Safflower": 6540, "Cotton(Lint)": 8267, "Jute": 5650,
    "Sugarcane": 365, # Official FRP for 2026-27

    #Unofficial / Non-Mandated Projected Estimates ---
    "Arecanut": 51200, "Banana": 3650, "Black Pepper": 68500, 
    "Cardamom": 165000, "Cashewnut": 13800, "Castor Seed": 6600, 
    "Coconut": 4050, "Coriander": 8600, "Cowpea(Lobia)": 8000, 
    "Dry Chillies": 20500, "Garlic": 11200, "Ginger": 13800, 
    "Horse-Gram": 7400, "Khesari": 5750, "Linseed": 6200, 
    "Mesta": 6100, "Moth Beam": 7400, "Onion": 2900, 
    "Other Kharif Pulses": 7950, "Other Rabi Pulses": 7950, 
    "Peas & Beans (Pulses)": 6850, "Potato": 2100, 
    "Sannhamp": 5750, "Small millets": 4900, "Sweet potato": 2550, 
    "Tapioca": 2100, "Tobacco": 9750, "Turmeric": 14800
}
CALIBRATION_MAP = {
    "Andhra Pradesh": {
        "ANANTAPUR": {"Arecanut": 1.0, "Arhar/Tur": 0.965, "Bajra": 1.0, "Banana": 1.0, "Cashewnut": 1.0, "Coconut": 1.0, "Coriander": 0.969, "Cowpea(Lobia)": 0.888, "Gram": 1.086, "Groundnut": 1.0, "Jowar": 1.0, "Linseed": 1.0, "Maize": 1.0, "Mesta": 0.813, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 1.0, "Ragi": 1.0, "Rice": 1.0, "Safflower": 0.945, "Sesamum": 0.982, "Soyabean": 1.001, "Sugarcane": 0.997, "Sunflower": 1.0, "Tobacco": 1.0, "Urad": 1.0, "Wheat": 0.988},
        "CHITTOOR": {"Arhar/Tur": 1.243, "Cashewnut": 1.421, "Coriander": 1.204, "Cowpea(Lobia)": 1.111, "Gram": 0.97, "Linseed": 0.72, "Potato": 0.917, "Sesamum": 1.022, "Sugarcane": 1.003, "Tapioca": 0.999},
        "EAST GODAVARI": {"Arhar/Tur": 1.353, "Ginger": 0.942, "Mesta": 0.995, "Tapioca": 0.986, "Tobacco": 1.64},
        "GUNTUR": {"Rapeseed &Mustard": 0.969, "Soyabean": 0.922},
        "KADAPA": {"Ginger": 1.775, "Gram": 0.388, "Linseed": 1.002, "Rapeseed &Mustard": 1.0, "Soyabean": 1.091, "Wheat": 2.151},
        "KARIMNAGAR": {"Ginger": 3.231},
        "KRISHNA": {"Ginger": 0.961},
        "KURNOOL": {"Ginger": 1.001, "Mesta": 1.005, "Rapeseed &Mustard": 1.4, "Safflower": 1.1, "Wheat": 0.258},
        "PRAKASAM": {"Ginger": 1.049, "Soyabean": 0.75},
        "SPSR NELLORE": {"Tapioca": 1.029},
        "SRIKAKULAM": {"Garlic": 1.0, "Mesta": 1.102},
        "Unknown_District": {"Black Pepper": 1.0, "Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Oilseeds Total": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
        "VISAKHAPATANAM": {"Gram": 0.157, "Tapioca": 1.514},
        "VIZIANAGARAM": {"Wheat": 1.008},
    },
    "Arunachal Pradesh": {
        "ANJAW": {"Ginger": 1.0, "Groundnut": 1.0, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.0, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 0.767},
        "CHANGLANG": {"Sugarcane": 1.012, "Sunflower": 1.0, "Wheat": 1.0},
        "DIBANG VALLEY": {"Arhar/Tur": 1.0, "Sugarcane": 0.943},
        "Unknown_District": {"Dry Chillies": 1.0, "Oilseeds Total": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
    "Assam": {
        "BAKSA": {"Arecanut": 1.0, "Arhar/Tur": 1.0, "Banana": 1.0, "Coconut": 1.0, "Ginger": 1.0, "Gram": 1.0, "Jute": 1.0, "Linseed": 1.0, "Maize": 1.0, "Masoor": 1.0, "Mesta": 1.0, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Sugarcane": 1.0, "Tapioca": 1.0, "Tobacco": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "Unknown_District": {"Black Pepper": 1.0, "Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Bihar": {
        "ARARIA": {"Arhar/Tur": 1.0, "Barley": 1.028, "Coriander": 1.001, "Garlic": 1.004, "Gram": 1.003, "Jute": 1.0, "Khesari": 1.084, "Linseed": 1.008, "Maize": 1.089, "Masoor": 1.0, "Mesta": 5.427, "Moong(Green Gram)": 1.008, "Onion": 1.0, "Potato": 1.0, "Ragi": 1.103, "Rapeseed &Mustard": 1.036, "Rice": 1.017, "Safflower": 0.999, "Sesamum": 1.0, "Sunflower": 1.0, "Tobacco": 1.079, "Turmeric": 1.002, "Urad": 0.998, "Wheat": 1.0},
        "ARWAL": {"Arhar/Tur": 1.008, "Barley": 0.958, "Garlic": 0.989, "Gram": 0.636, "Groundnut": 1.0, "Khesari": 0.936, "Linseed": 1.0, "Maize": 0.532, "Moong(Green Gram)": 0.935, "Ragi": 0.964, "Rapeseed &Mustard": 0.919, "Sannhamp": 0.996, "Sesamum": 1.002, "Sugarcane": 1.0, "Urad": 1.005},
        "AURANGABAD": {"Arhar/Tur": 0.929, "Groundnut": 0.998},
        "BANKA": {"Sannhamp": 1.0},
        "BEGUSARAI": {"Bajra": 1.001, "Coriander": 0.996, "Groundnut": 1.001, "Jowar": 1.0, "Rice": 0.768, "Tobacco": 1.0, "Turmeric": 0.986},
        "BHAGALPUR": {"Bajra": 1.0, "Mesta": 0.817, "Tobacco": 0.997},
        "BHOJPUR": {"Jowar": 1.001, "Safflower": 1.011},
        "DARBHANGA": {"Safflower": 0.998},
        "KATIHAR": {"Ginger": 1.0},
        "KISHANGANJ": {"Ginger": 1.016},
        "Unknown_District": {"Castor Seed": 1.0, "Horse-Gram": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
    "Chhattisgarh": {
        "BALOD": {"Arhar/Tur": 1.0, "Barley": 0.954, "Coriander": 1.0, "Ginger": 0.993, "Gram": 1.0, "Groundnut": 1.19, "Jowar": 0.954, "Khesari": 1.0, "Linseed": 1.0, "Maize": 1.0, "Masoor": 1.0, "Mesta": 1.0, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Ragi": 1.002, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Safflower": 0.93, "Sannhamp": 2.659, "Sesamum": 1.0, "Soyabean": 1.174, "Sugarcane": 0.889, "Sunflower": 1.03, "Turmeric": 0.995, "Urad": 1.003, "Wheat": 1.0},
        "BALODA BAZAR": {"Bajra": 0.042, "Barley": 0.763, "Garlic": 0.997, "Ginger": 1.007, "Groundnut": 0.958, "Jowar": 0.951, "Mesta": 0.978, "Onion": 0.915, "Potato": 1.04, "Safflower": 1.017, "Sannhamp": 0.713, "Soyabean": 0.809, "Sunflower": 1.391, "Turmeric": 1.012},
        "BALRAMPUR": {"Bajra": 0.035, "Barley": 1.135, "Coriander": 1.834, "Garlic": 1.051, "Ginger": 0.978, "Jowar": 1.507, "Maize": 1.307, "Mesta": 1.079, "Onion": 2.811, "Potato": 1.0, "Ragi": 0.97, "Sannhamp": 1.092, "Sugarcane": 15.356, "Sunflower": 0.095, "Tobacco": 0.985},
        "BASTAR": {"Moong(Green Gram)": 0.932, "Potato": 0.846, "Tobacco": 0.937, "Urad": 0.965},
        "BEMETARA": {"Barley": 0.789},
        "BILASPUR": {"Bajra": 1.176},
        "KANKER": {"Sunflower": 0.016},
        "SURAJPUR": {"Tobacco": 1.117},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Delhi": {
        "DELHI_TOTAL": {"Bajra": 1.0, "Barley": 1.0, "Gram": 1.0, "Jowar": 1.0, "Maize": 1.0, "Potato": 1.0, "Rice": 1.0, "Sugarcane": 1.0, "Wheat": 1.0},
    },
    "Goa": {
        "NORTH GOA": {"Arecanut": 1.0, "Banana": 1.0, "Cashewnut": 1.0, "Coconut": 1.0, "Groundnut": 1.0, "Ragi": 1.0, "Rice": 1.0, "Sugarcane": 1.0},
        "Unknown_District": {"Black Pepper": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Sweet Potato": 1.0},
    },
    "Gujarat": {
        "AHMADABAD": {"Arhar/Tur": 1.0, "Bajra": 1.0, "Banana": 1.0, "Garlic": 0.978, "Gram": 1.0, "Groundnut": 0.965, "Jowar": 0.883, "Maize": 1.039, "Moong(Green Gram)": 1.0, "Moth": 1.0, "Onion": 0.953, "Other Cereals": 0.94, "Potato": 1.061, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.181, "Tobacco": 1.0, "Urad": 0.94, "Wheat": 1.0},
        "AMRELI": {"Banana": 0.994, "Garlic": 1.0, "Groundnut": 1.018, "Jowar": 1.069, "Maize": 0.942, "Onion": 1.004, "Other Cereals": 1.49, "Potato": 1.035, "Sesamum": 1.392, "Sugarcane": 1.007, "Urad": 2.189},
        "ANAND": {"Banana": 1.013, "Jowar": 1.051, "Maize": 0.921, "Other Cereals": 0.845, "Potato": 0.982, "Soyabean": 1.381, "Tobacco": 0.995, "Urad": 0.968},
        "ARAVALLI": {"Jowar": 0.917, "Maize": 1.082, "Soyabean": 0.975, "Urad": 1.477},
        "BANAS KANTHA": {"Jowar": 1.043, "Maize": 0.953, "Other Cereals": 0.839, "Ragi": 1.106},
        "BHARUCH": {"Jowar": 0.995, "Maize": 0.978, "Sugarcane": 0.515},
        "BHAVNAGAR": {"Onion": 0.993, "Other Cereals": 0.798, "Urad": 2.276},
        "CHHOTAUDEPUR": {"Other Cereals": 1.06},
        "DANG": {"Ragi": 0.995, "Soyabean": 0.983},
        "DOHAD": {"Soyabean": 0.998},
        "GIR SOMNATH": {"Urad": 1.0},
        "JAMNAGAR": {"Urad": 0.999},
        "JUNAGADH": {"Urad": 1.926},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Guar Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Small Millets": 1.0},
    },
    "Haryana": {
        "AMBALA": {"Arhar/Tur": 1.055, "Bajra": 0.932, "Barley": 1.061, "Coriander": 1.0, "Garlic": 1.0, "Ginger": 1.283, "Gram": 1.0, "Jowar": 1.0, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.362, "Onion": 1.007, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.362, "Sugarcane": 1.0, "Sunflower": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "BHIWANI": {"Arhar/Tur": 0.997, "Bajra": 1.014, "Barley": 0.998, "Coriander": 1.311, "Gram": 0.957, "Groundnut": 1.007, "Jowar": 1.024, "Maize": 1.092, "Moong(Green Gram)": 0.982, "Moth": 0.818, "Sesamum": 0.992},
        "CHARKI DADRI": {"Jowar": 0.994, "Moth": 1.723},
        "FARIDABAD": {"Jowar": 0.957},
        "FATEHABAD": {"Groundnut": 0.999, "Moth": 1.0, "Onion": 0.754},
        "KAITHAL": {"Coriander": 0.529},
        "KURUKSHETRA": {"Maize": 0.7},
        "PANCHKULA": {"Ginger": 0.688},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Guar Seed": 1.0, "Horse-Gram": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0},
    },
    "Himachal Pradesh": {
        "BILASPUR": {"Arhar/Tur": 1.739, "Bajra": 1.35, "Barley": 1.0, "Coriander": 1.037, "Garlic": 1.001, "Ginger": 1.0, "Gram": 1.0, "Groundnut": 1.174, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 0.845, "Ragi": 1.064, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "CHAMBA": {"Coriander": 0.718, "Garlic": 0.637, "Masoor": 1.096, "Moth": 1.0, "Potato": 1.201, "Ragi": 0.999},
        "HAMIRPUR": {"Bajra": 1.0, "Linseed": 0.845, "Tobacco": 1.0},
        "KANGRA": {"Arhar/Tur": 1.0, "Linseed": 1.003},
        "KULLU": {"Groundnut": 0.929},
        "SHIMLA": {"Arhar/Tur": 0.773},
        "SOLAN": {"Sannhamp": 1.0},
        "Unknown_District": {"Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
    "Jammu And Kashmir": {
        "Unknown_District": {"Bajra": 1.0, "Barley": 1.0, "Cotton(Lint)": 1.0, "Cowpea(Lobia)": 1.0, "Dry Chillies": 1.0, "Garlic": 1.0, "Ginger": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Horse-Gram": 1.0, "Jowar": 1.0, "Linseed": 1.0, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.0, "Moth": 1.0, "Onion": 1.0, "Other  Rabi Pulses": 1.0, "Other Cereals": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0, "Potato": 1.0, "Ragi": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sannhamp": 1.0, "Sesamum": 1.0, "Small Millets": 1.0, "Sugarcane": 1.0, "Tobacco": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 1.0},
    },
    "Jharkhand": {
        "BOKARO": {"Arhar/Tur": 1.0, "Bajra": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Jowar": 1.0, "Linseed": 1.087, "Maize": 0.938, "Masoor": 1.015, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 1.0, "Ragi": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Urad": 1.0, "Wheat": 1.011},
        "CHATRA": {"Linseed": 0.913, "Maize": 1.022, "Masoor": 0.961, "Ragi": 1.003, "Sugarcane": 1.0, "Sunflower": 0.996, "Wheat": 0.989},
        "DUMKA": {"Safflower": 1.0, "Sunflower": 1.046},
        "Unknown_District": {"Castor Seed": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0},
    },
    "Karnataka": {
        "BAGALKOT": {"Arhar/Tur": 0.982, "Bajra": 1.004, "Banana": 1.0, "Cashewnut": 1.059, "Coconut": 0.989, "Coriander": 1.0, "Cowpea(Lobia)": 1.007, "Garlic": 1.023, "Ginger": 1.0, "Gram": 0.959, "Groundnut": 0.945, "Jowar": 0.823, "Linseed": 0.922, "Maize": 0.998, "Mesta": 1.0, "Moong(Green Gram)": 1.001, "Onion": 0.966, "Potato": 0.564, "Ragi": 0.711, "Rice": 1.0, "Safflower": 0.966, "Sannhamp": 0.996, "Sesamum": 0.945, "Soyabean": 0.987, "Sugarcane": 1.031, "Sunflower": 0.993, "Tapioca": 1.48, "Tobacco": 0.999, "Turmeric": 0.941, "Urad": 0.761, "Wheat": 0.993},
        "BAGALKOTE": {"Arecanut": 1.103, "Arhar/Tur": 1.0, "Bajra": 1.02, "Cashewnut": 1.771, "Coconut": 1.0, "Cowpea(Lobia)": 0.788, "Garlic": 4.105, "Ginger": 0.405, "Gram": 1.155, "Groundnut": 1.126, "Jowar": 0.962, "Linseed": 1.994, "Maize": 1.106, "Moong(Green Gram)": 1.125, "Onion": 1.61, "Potato": 0.801, "Ragi": 0.936, "Rice": 1.084, "Safflower": 1.37, "Sannhamp": 2.434, "Sesamum": 1.482, "Soyabean": 1.114, "Sugarcane": 0.985, "Sunflower": 1.288, "Tapioca": 1.414, "Tobacco": 1.057, "Turmeric": 1.106, "Urad": 0.975, "Wheat": 1.117},
        "BALLARI": {"Ragi": 1.055, "Rapeseed &Mustard": 1.073},
        "BANGALORE RURAL": {"Arecanut": 0.972, "Cardamom": 1.329, "Cashewnut": 0.863, "Garlic": 0.863, "Ginger": 1.07, "Groundnut": 1.891, "Mesta": 1.149, "Moong(Green Gram)": 0.619, "Potato": 1.013, "Ragi": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.046, "Tapioca": 0.974, "Tobacco": 1.001, "Urad": 0.999},
        "BELAGAVI": {"Cardamom": 1.794},
        "BELGAUM": {"Bajra": 1.051, "Jowar": 1.323, "Mesta": 0.98, "Moong(Green Gram)": 0.95, "Rapeseed &Mustard": 0.905, "Rice": 0.846, "Sannhamp": 0.989, "Tobacco": 0.886, "Urad": 1.065},
        "BELLARY": {"Bajra": 0.929, "Coriander": 0.909, "Moong(Green Gram)": 1.189, "Rice": 0.858, "Urad": 1.055},
        "BENGALURU URBAN": {"Rice": 0.872},
        "BIDAR": {"Mesta": 0.945, "Sannhamp": 0.995},
        "CHAMARAJANAGAR": {"Cardamom": 1.0, "Rice": 0.758},
        "CHIKMAGALUR": {"Cardamom": 0.945, "Moong(Green Gram)": 1.041, "Urad": 1.094},
        "CHITRADURGA": {"Coriander": 1.214, "Rice": 0.957},
        "HAVERI": {"Moong(Green Gram)": 1.009},
        "UDUPI": {"Groundnut": 2.334},
        "Unknown_District": {"Black Pepper": 1.0, "Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Kerala": {
        "ALAPPUZHA": {"Arecanut": 1.0, "Banana": 1.0, "Cashewnut": 1.0, "Coconut": 1.0, "Ginger": 1.0, "Gram": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Sugarcane": 1.0, "Tapioca": 1.0, "Turmeric": 1.0},
        "IDUKKI": {"Arhar/Tur": 1.019, "Cardamom": 1.0, "Garlic": 1.0, "Maize": 1.0, "Potato": 1.0, "Ragi": 1.006, "Wheat": 1.0},
        "KASARAGOD": {"Jowar": 1.0, "Tobacco": 1.0},
        "PALAKKAD": {"Arhar/Tur": 0.994, "Groundnut": 1.0, "Jowar": 0.999, "Ragi": 0.856, "Soyabean": 1.0},
        "Unknown_District": {"Black Pepper": 1.0, "Cotton(Lint)": 1.0, "Other Kharif Pulses": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Madhya Pradesh": {
        "AGAR MALWA": {"Arhar/Tur": 1.134, "Bajra": 0.958, "Barley": 0.944, "Coriander": 1.017, "Garlic": 1.003, "Ginger": 1.004, "Gram": 1.055, "Groundnut": 1.013, "Jowar": 1.139, "Jute": 0.39, "Linseed": 1.174, "Maize": 1.065, "Masoor": 1.008, "Moong(Green Gram)": 1.176, "Onion": 1.031, "Potato": 1.042, "Rapeseed &Mustard": 1.0, "Rice": 0.971, "Sannhamp": 1.175, "Sesamum": 0.989, "Soyabean": 0.847, "Sugarcane": 0.997, "Turmeric": 1.015, "Urad": 1.143, "Wheat": 1.052},
        "ALIRAJPUR": {"Arhar/Tur": 0.678, "Bajra": 1.093, "Barley": 1.466, "Coriander": 0.391, "Garlic": 0.487, "Ginger": 0.087, "Gram": 0.943, "Groundnut": 1.0, "Jowar": 0.911, "Maize": 0.967, "Mesta": 0.547, "Moong(Green Gram)": 0.782, "Onion": 0.803, "Rice": 1.26, "Sannhamp": 0.846, "Sesamum": 1.163, "Soyabean": 1.063, "Sugarcane": 0.902, "Turmeric": 0.062, "Urad": 0.737, "Wheat": 0.918},
        "ANUPPUR": {"Banana": 0.999, "Cowpea(Lobia)": 1.0, "Khesari": 1.0, "Linseed": 0.977, "Masoor": 0.835, "Other Cereals": 1.091, "Potato": 0.624, "Rapeseed &Mustard": 0.988, "Safflower": 1.112, "Sugarcane": 1.095, "Tobacco": 1.082, "Urad": 0.838},
        "ASHOKNAGAR": {"Sugarcane": 0.785, "Sunflower": 0.922, "Urad": 0.899},
        "BALAGHAT": {"Banana": 1.001, "Jute": 1.0, "Mesta": 1.0, "Moong(Green Gram)": 0.749, "Ragi": 1.0, "Safflower": 0.988, "Sugarcane": 1.0, "Sunflower": 1.0},
        "BARWANI": {"Sugarcane": 1.016},
        "BURHANPUR": {"Sunflower": 1.263},
        "CHHATARPUR": {"Safflower": 1.261, "Tobacco": 0.803},
        "CHHINDWARA": {"Mesta": 1.529, "Safflower": 1.045, "Sunflower": 0.643},
        "DEWAS": {"Safflower": 0.67},
        "HOSHANGABAD": {"Sunflower": 1.263},
        "MORENA": {"Jute": 3.269},
        "REWA": {"Sunflower": 0.632},
        "SIDHI": {"Other Cereals": 0.779},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Maharashtra": {
        "AHMEDNAGAR": {"Arhar/Tur": 1.0, "Bajra": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Jowar": 0.97, "Linseed": 1.039, "Maize": 1.028, "Moong(Green Gram)": 1.0, "Other Cereals": 0.977, "Other Summer Pulses": 1.0, "Ragi": 1.0, "Rapeseed &Mustard": 0.997, "Rice": 0.813, "Safflower": 1.004, "Sesamum": 1.027, "Soyabean": 1.0, "Sugarcane": 1.0, "Sunflower": 0.827, "Urad": 1.0, "Wheat": 1.0},
        "AKOLA": {"Jowar": 1.668, "Rapeseed &Mustard": 1.003, "Safflower": 0.95, "Sesamum": 0.864},
        "AMRAVATI": {"Maize": 0.623, "Rapeseed &Mustard": 1.014, "Sunflower": 1.13},
        "AURANGABAD": {"Linseed": 1.165, "Maize": 0.758, "Other Cereals": 1.125, "Sesamum": 102.493, "Sunflower": 0.986},
        "BEED": {"Linseed": 0.87, "Rapeseed &Mustard": 0.822, "Safflower": 0.866, "Sunflower": 1.446},
        "BHANDARA": {"Rice": 1.053, "Sesamum": 0.658},
        "BULDHANA": {"Sunflower": 2.123},
        "GADCHIROLI": {"Sesamum": 1.344},
        "KOLHAPUR": {"Sunflower": 1.491, "Tobacco": 1.0},
        "THANE": {"Sesamum": 0.614},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Small Millets": 1.0},
    },
    "Manipur": {
        "BISHNUPUR": {"Arhar/Tur": 1.0, "Banana": 1.0, "Cowpea(Lobia)": 1.0, "Ginger": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.0, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Turmeric": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "IMPHAL EAST": {"Cashewnut": 1.0},
        "Unknown_District": {"Dry Chillies": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0},
    },
    "Meghalaya": {
        "EAST GARO HILLS": {"Arecanut": 1.0, "Arhar/Tur": 1.0, "Banana": 1.0, "Cashewnut": 1.0, "Coriander": 1.0, "Cowpea(Lobia)": 1.0, "Ginger": 1.0, "Gram": 1.0, "Jute": 1.0, "Maize": 1.0, "Masoor": 1.0, "Mesta": 1.0, "Onion": 1.0, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Tapioca": 1.0, "Tobacco": 1.0, "Turmeric": 1.0, "Wheat": 1.0},
        "SOUTH WEST GARO HILLS": {"Linseed": 1.008},
        "Unknown_District": {"Black Pepper": 1.0, "Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Other  Rabi Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
        "WEST GARO HILLS": {"Linseed": 0.863},
    },
    "Mizoram": {
        "AIZAWL": {"Arhar/Tur": 1.047, "Cowpea(Lobia)": 1.076, "Maize": 1.0, "Onion": 1.049, "Potato": 1.213, "Rapeseed &Mustard": 1.186, "Rice": 0.886, "Sesamum": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Tapioca": 0.827, "Tobacco": 1.024},
        "CHAMPHAI": {"Arhar/Tur": 0.967, "Onion": 0.696, "Potato": 0.881, "Rapeseed &Mustard": 1.0, "Tapioca": 1.076, "Tobacco": 0.964},
        "KOLASIB": {"Arhar/Tur": 0.952, "Cowpea(Lobia)": 0.946, "Onion": 3.89, "Potato": 1.29, "Rapeseed &Mustard": 1.277, "Rice": 1.027, "Tapioca": 0.949},
        "LAWNGTLAI": {"Onion": 0.967, "Potato": 0.749, "Rapeseed &Mustard": 0.443, "Rice": 1.019},
        "LUNGLEI": {"Potato": 0.919},
        "MAMIT": {"Potato": 0.971, "Rapeseed &Mustard": 0.509},
        "SAIHA": {"Potato": 0.191},
        "Unknown_District": {"Cotton(Lint)": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0},
    },
    "Nagaland": {
        "DIMAPUR": {"Arhar/Tur": 1.0, "Bajra": 1.0, "Barley": 1.0, "Cowpea(Lobia)": 1.0, "Ginger": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Jute": 1.0, "Linseed": 1.0, "Maize": 1.0, "Masoor": 1.0, "Mesta": 1.0, "Moong(Green Gram)": 1.0, "Other Cereals": 0.998, "Potato": 1.0, "Ragi": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Sunflower": 0.965, "Tapioca": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "KIPHIRE": {"Other Cereals": 1.015, "Sunflower": 1.299},
        "KOHIMA": {"Jowar": 1.0},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Odisha": {
        "ANUGUL": {"Groundnut": 0.99, "Maize": 1.01, "Moong(Green Gram)": 1.0, "Potato": 1.0, "Ragi": 0.957, "Rapeseed &Mustard": 1.0, "Rice": 0.977, "Sesamum": 1.0, "Sugarcane": 1.0, "Urad": 1.0, "Wheat": 1.004},
        "BALANGIR": {"Cowpea(Lobia)": 1.0, "Groundnut": 1.076, "Maize": 0.734, "Ragi": 1.006, "Rice": 1.85, "Wheat": 1.146},
        "BALESHWAR": {"Jute": 1.0, "Wheat": 0.824},
        "BARGARH": {"Wheat": 0.86},
        "BOUDH": {"Groundnut": 1.166},
        "GAJAPATI": {"Ragi": 1.046},
        "KANDHAMAL": {"Sunflower": 1.0},
        "Unknown_District": {"Castor Seed": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Sweet Potato": 1.0},
    },
    "Puducherry": {
        "KARAIKAL": {"Banana": 1.0, "Cashewnut": 1.0, "Coconut": 1.0, "Groundnut": 0.62, "Moong(Green Gram)": 0.619, "Ragi": 0.99, "Rice": 0.958, "Sesamum": 1.054, "Urad": 0.462},
        "MAHE": {"Arecanut": 1.0, "Tapioca": 0.866},
        "PONDICHERRY": {"Bajra": 1.0, "Groundnut": 1.0, "Jowar": 1.0, "Moong(Green Gram)": 1.558, "Onion": 1.0, "Other Summer Pulses": 1.0, "Ragi": 1.014, "Rice": 1.119, "Sesamum": 0.983, "Sugarcane": 1.0, "Tapioca": 1.01, "Turmeric": 1.0, "Urad": 1.2},
        "Unknown_District": {"Black Pepper": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
        "YANAM": {"Coriander": 1.0, "Moong(Green Gram)": 1.0},
    },
    "Punjab": {
        "AMRITSAR": {"Arhar/Tur": 1.0, "Bajra": 1.571, "Gram": 1.018, "Maize": 1.006, "Masoor": 0.957, "Moong(Green Gram)": 0.997, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Sugarcane": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "BARNALA": {"Barley": 1.003, "Gram": 0.98, "Moong(Green Gram)": 1.01},
        "BATHINDA": {"Bajra": 0.971, "Barley": 0.98, "Gram": 0.995},
        "FATEHGARH SAHIB": {"Maize": 1.0, "Sunflower": 1.0},
        "FAZILKA": {"Bajra": 1.571, "Groundnut": 1.009},
        "FIROZEPUR": {"Masoor": 1.029},
        "GURDASPUR": {"Masoor": 0.92},
        "HOSHIARPUR": {"Groundnut": 0.989},
        "MANSA": {"Bajra": 0.943},
        "Unknown_District": {"Cotton(Lint)": 1.0, "Guar Seed": 1.0, "Peas & Beans (Pulses)": 1.0},
    },
    "Sikkim": {
        "EAST DISTRICT": {"Barley": 1.0, "Maize": 1.0, "Other Cereals": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Soyabean": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "Unknown_District": {"Other Kharif Pulses": 1.0, "Small Millets": 1.0},
    },
    "Tamil Nadu": {
        "ARIYALUR": {"Arecanut": 1.094, "Arhar/Tur": 1.0, "Bajra": 1.0, "Banana": 1.0, "Cashewnut": 1.0, "Coconut": 1.0, "Coriander": 1.0, "Cowpea(Lobia)": 1.003, "Groundnut": 1.0, "Jowar": 1.0, "Maize": 1.0, "Masoor": 1.0, "Moong(Green Gram)": 1.031, "Onion": 1.0, "Ragi": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Sugarcane": 1.0, "Sunflower": 1.175, "Tapioca": 1.0, "Tobacco": 0.988, "Turmeric": 1.0, "Urad": 1.0},
        "CHENGALPATTU": {"Other Cereals": 1.0},
        "COIMBATORE": {"Arecanut": 0.957, "Cardamom": 1.0, "Cowpea(Lobia)": 0.916, "Ginger": 1.112, "Gram": 1.0, "Moong(Green Gram)": 0.965, "Other Cereals": 1.017, "Rapeseed &Mustard": 1.003, "Sunflower": 0.774, "Tobacco": 1.001},
        "DHARMAPURI": {"Garlic": 0.995, "Potato": 0.979, "Rapeseed &Mustard": 0.985},
        "DINDIGUL": {"Garlic": 1.007, "Other Cereals": 0.993, "Potato": 1.021, "Sunflower": 0.875},
        "ERODE": {"Ginger": 0.442, "Rapeseed &Mustard": 1.008},
        "KALLAKURICHI": {"Other Cereals": 1.096},
        "KARUR": {"Other Cereals": 0.102},
        "KRISHNAGIRI": {"Rapeseed &Mustard": 1.002},
        "Unknown_District": {"Black Pepper": 1.0, "Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Telangana": {
        "ADILABAD": {"Arhar/Tur": 0.99, "Bajra": 1.004, "Banana": 1.0, "Cashewnut": 1.544, "Coriander": 1.008, "Cowpea(Lobia)": 1.0, "Garlic": 1.0, "Ginger": 1.013, "Gram": 1.051, "Groundnut": 1.041, "Jowar": 1.0, "Maize": 1.0, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 0.827, "Ragi": 0.816, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Safflower": 1.057, "Sesamum": 1.214, "Soyabean": 1.092, "Sugarcane": 1.0, "Sunflower": 1.0, "Tobacco": 1.049, "Turmeric": 0.992, "Urad": 0.99, "Wheat": 1.163},
        "BHADRADRI": {"Arhar/Tur": 1.021, "Bajra": 0.927, "Cashewnut": 0.839, "Groundnut": 1.058, "Sesamum": 0.518, "Tobacco": 0.974, "Turmeric": 1.0, "Urad": 1.032},
        "HANUMAKONDA": {"Ragi": 1.379},
        "JAGITIAL": {"Bajra": 0.828},
        "JANGOAN": {"Coriander": 1.289, "Tobacco": 1.036},
        "JOGULAMBA": {"Bajra": 0.926, "Sunflower": 1.212},
        "KAMAREDDY": {"Ragi": 1.01, "Safflower": 0.918, "Soyabean": 0.77},
        "KARIMNAGAR": {"Coriander": 0.598, "Ginger": 0.943, "Groundnut": 0.84},
        "KHAMMAM": {"Cashewnut": 1.948, "Coconut": 1.0, "Ginger": 1.012, "Groundnut": 0.772, "Mesta": 1.0},
        "KOMARAM BHEEM ASIFABAD": {"Coriander": 1.375, "Ragi": 0.852},
        "MAHBUBNAGAR": {"Bajra": 1.0, "Potato": 1.102, "Ragi": 0.986, "Sunflower": 0.507, "Tobacco": 0.698, "Wheat": 0.72},
        "MEDAK": {"Ginger": 0.944, "Linseed": 1.0, "Masoor": 1.0, "Potato": 1.033},
        "NAGARKURNOOL": {"Potato": 0.978},
        "NARAYANAPET": {"Sunflower": 1.092},
        "NIZAMABAD": {"Coriander": 0.715, "Soyabean": 0.96},
        "RANGAREDDI": {"Gram": 0.693, "Potato": 1.133, "Safflower": 1.494, "Soyabean": 1.305},
        "SIDDIPET": {"Ginger": 0.997, "Potato": 0.245},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Horse-Gram": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Tripura": {
        "DHALAI": {"Arhar/Tur": 1.0, "Cowpea(Lobia)": 1.0, "Gram": 1.0, "Groundnut": 1.0, "Jowar": 1.0, "Jute": 1.0, "Khesari": 1.0, "Linseed": 1.0, "Maize": 1.0, "Masoor": 1.0, "Mesta": 1.0, "Moong(Green Gram)": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Sesamum": 1.0, "Soyabean": 1.0, "Sugarcane": 1.0, "Urad": 1.0, "Wheat": 1.0},
        "GOMATI": {"Soyabean": 1.002},
        "Unknown_District": {"Cotton(Lint)": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
    "Uttar Pradesh": {
        "AGRA": {"Arhar/Tur": 1.0, "Bajra": 1.0, "Banana": 1.007, "Barley": 1.0, "Coriander": 1.0, "Garlic": 1.0, "Gram": 1.0, "Groundnut": 1.054, "Jowar": 1.0, "Maize": 0.894, "Masoor": 1.0, "Moong(Green Gram)": 1.0, "Onion": 1.0, "Potato": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 0.948, "Sannhamp": 1.003, "Sesamum": 1.0, "Sugarcane": 1.0, "Sunflower": 1.184, "Urad": 0.959, "Wheat": 1.0},
        "ALIGARH": {"Banana": 0.983, "Groundnut": 0.98, "Linseed": 1.016, "Maize": 1.452, "Sunflower": 0.958, "Tobacco": 1.754, "Turmeric": 1.999, "Urad": 1.109},
        "ALLAHABAD": {"Linseed": 1.0, "Maize": 1.363, "Sannhamp": 0.966, "Tobacco": 0.911},
        "AMBEDKAR NAGAR": {"Maize": 1.356, "Sunflower": 1.115, "Tobacco": 1.404},
        "AMETHI": {"Turmeric": 0.978},
        "AMROHA": {"Rice": 1.0, "Tobacco": 1.51},
        "AZAMGARH": {"Ginger": 0.598, "Soyabean": 1.972, "Tobacco": 0.508},
        "BAHRAICH": {"Ginger": 1.0, "Soyabean": 0.969},
        "BALLIA": {"Rice": 1.147},
        "BAREILLY": {"Rice": 1.127},
        "BUDAUN": {"Tobacco": 1.002},
        "FARRUKHABAD": {"Tobacco": 0.783},
        "Unknown_District": {"Cotton(Lint)": 1.0, "Dry Chillies": 1.0, "Guar Seed": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0, "Sweet Potato": 1.0},
    },
    "Uttarakhand": {
        "ALMORA": {"Arhar/Tur": 1.0, "Barley": 1.0, "Garlic": 1.0, "Gram": 1.0, "Groundnut": 0.927, "Maize": 0.957, "Masoor": 1.0, "Onion": 1.0, "Other Cereals": 1.065, "Potato": 1.0, "Ragi": 1.0, "Rapeseed &Mustard": 1.0, "Rice": 0.741, "Sesamum": 1.0, "Soyabean": 1.0, "Sunflower": 1.205, "Turmeric": 1.0, "Urad": 1.049, "Wheat": 1.0},
        "BAGESHWAR": {"Bajra": 1.0, "Groundnut": 0.961, "Other Cereals": 0.704},
        "CHAMOLI": {"Other Cereals": 1.077},
        "CHAMPAWAT": {"Bajra": 1.0, "Groundnut": 1.065, "Maize": 1.06, "Moong(Green Gram)": 1.0, "Other Cereals": 1.064, "Sugarcane": 1.0, "Urad": 0.666},
        "DEHRADUN": {"Linseed": 1.4, "Moong(Green Gram)": 0.916, "Moth": 0.844, "Sunflower": 1.176, "Urad": 0.891},
        "HARIDWAR": {"Bajra": 1.0, "Linseed": 1.0, "Moong(Green Gram)": 1.088, "Rice": 1.057, "Sunflower": 1.236, "Tobacco": 1.0, "Urad": 0.556},
        "NAINITAL": {"Moong(Green Gram)": 1.088, "Moth": 1.021, "Rice": 1.035},
        "PAURI GARHWAL": {"Sunflower": 0.751},
        "PITHORAGARH": {"Sunflower": 0.706, "Tobacco": 1.833},
        "UDAM SINGH NAGAR": {"Moong(Green Gram)": 0.952, "Other Summer Pulses": 1.0, "Sunflower": 0.824},
        "Unknown_District": {"Horse-Gram": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Other Oilseeds": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
    "West Bengal": {
        "24 PARAGANAS NORTH": {"Arhar/Tur": 1.053, "Coconut": 1.0, "Gram": 1.0, "Groundnut": 1.056, "Jute": 1.0, "Khesari": 1.0, "Linseed": 1.009, "Maize": 1.007, "Masoor": 1.0, "Mesta": 0.987, "Moong(Green Gram)": 0.992, "Potato": 2.374, "Rapeseed &Mustard": 1.0, "Rice": 1.0, "Safflower": 1.0, "Sesamum": 1.242, "Sugarcane": 1.0, "Sunflower": 1.0, "Urad": 0.809, "Wheat": 1.0},
        "24 PARAGANAS SOUTH": {"Arhar/Tur": 1.0, "Linseed": 0.989, "Maize": 1.165},
        "ALIPURDUAR": {"Groundnut": 0.524, "Moong(Green Gram)": 1.105, "Ragi": 0.961, "Sesamum": 0.994, "Tobacco": 0.954, "Urad": 1.118},
        "BANKURA": {"Bajra": 1.117, "Barley": 1.005, "Groundnut": 0.492, "Maize": 0.53, "Moong(Green Gram)": 1.091, "Sannhamp": 1.0, "Sesamum": 0.952},
        "BARDHAMAN": {"Barley": 1.015, "Mesta": 1.076, "Moong(Green Gram)": 1.038, "Soyabean": 0.969},
        "BIRBHUM": {"Barley": 0.987, "Maize": 0.51, "Safflower": 1.128, "Soyabean": 1.0},
        "COOCHBEHAR": {"Bajra": 0.786, "Moong(Green Gram)": 0.957, "Ragi": 1.0, "Sesamum": 0.961, "Tobacco": 1.0, "Urad": 1.007},
        "DARJEELING": {"Potato": 0.984},
        "MURSHIDABAD": {"Jowar": 1.372},
        "PURBA BARDHAMAN": {"Safflower": 0.767},
        "PURULIA": {"Bajra": 1.069, "Jowar": 0.968, "Moth": 1.0},
        "Unknown_District": {"Castor Seed": 1.0, "Cotton(Lint)": 1.0, "Horse-Gram": 1.0, "Niger Seed": 1.0, "Other  Rabi Pulses": 1.0, "Other Kharif Pulses": 1.0, "Peas & Beans (Pulses)": 1.0, "Small Millets": 1.0},
    },
}


def asset(name):
    return MODEL_DIR / name


def load_assets():
    required = [MODEL_FILE, SCALER_FILE, LOOKUP_FILE, ENCODER_FILE, FEATURE_FILE, KERAS_FILE]
    missing = [name for name in required if not os.path.exists(asset(name))]

    csv_path = None
    for candidate in [CSV_FILE, LEGACY_CSV_FILE]:
        if os.path.exists(asset(candidate)):
            csv_path = asset(candidate)
            break
    if csv_path is None:
        missing.append(LEGACY_CSV_FILE)

    if missing:
        raise FileNotFoundError(f"Missing model files in {MODEL_DIR}: {', '.join(missing)}")

    models = joblib.load(asset(MODEL_FILE))
    scalers = joblib.load(asset(SCALER_FILE))
    lookup = joblib.load(asset(LOOKUP_FILE))
    encoders = joblib.load(asset(ENCODER_FILE))
    feature_names = joblib.load(asset(FEATURE_FILE))
    df = pd.read_csv(csv_path)

    if "District" in df.columns:
        baselines = {
            "stateCrop": df.groupby(["State", "Crop"]).median(numeric_only=True).to_dict("index"),
            "stateDistrictCrop": df.groupby(["State", "District", "Crop"]).median(numeric_only=True).to_dict("index")
        }
    else:
        baselines = {"stateCrop": df.groupby(["State", "Crop"]).median(numeric_only=True).to_dict("index")}

    return models, scalers, lookup, encoders, feature_names, df, baselines


def normalize_crop_key(crop_name):
    return str(crop_name).strip().lower().replace(" &", "&").replace("& ", "&")


def crop_group(lookup, crop_name):
    return lookup.get(normalize_crop_key(crop_name), "Other_Misc")


def performance_layer(yield_val_tonnes, baseline_yield_quintals):
    ratio = yield_val_tonnes / (baseline_yield_quintals / 10) if baseline_yield_quintals > 0 else 1.0
    layers = [
        (0.80, "TIER 1: PLATINUM", "#004D40", "Exceptional: Genetic Potential Maxed."),
        (0.65, "TIER 2: DIAMOND", "#00695C", "Elite: High Industrial Productivity."),
        (0.55, "TIER 3: GOLD", "#2E7D32", "Superior: Well above regional mean."),
        (0.45, "TIER 4: SILVER", "#388E3C", "Good: Efficient Resource Use."),
        (0.35, "TIER 5: STABLE", "#43A047", "Optimal: Standard Commercial Yield."),
        (0.25, "TIER 6: FAIR", "#FBC02D", "Average: Needs Minor Adjustments."),
        (0.18, "TIER 7: MARGINAL", "#FFA000", "Underperforming: Stress Detected."),
        (0.12, "TIER 8: CRITICAL", "#F57C00", "Low: Severe Resource Limitation."),
        (0.06, "TIER 9: POOR", "#D32F2F", "Failure: Major Intervention Needed."),
        (0.00, "TIER 10: INVIABLE", "#212121", "Total Loss Imminent.")
    ]
    for threshold, label, color, note in layers:
        if ratio >= threshold:
            return label, color, note
    return layers[-1][1], layers[-1][2], layers[-1][3]


def get_secret(name):
    if os.environ.get(name):
        return os.environ.get(name)
    if tomllib is None:
        return None
    try:
        with open(SECRETS_FILE, "rb") as fh:
            data = tomllib.load(fh)
        value = data.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip()
    except Exception:
        pass
    return None


def options():
    try:
        def options():
    try:
        csv_path = asset(CSV_FILE) if os.path.exists(asset(CSV_FILE)) else asset(LEGACY_CSV_FILE)
        df = pd.read_csv(csv_path)
        varieties_by_crop = {
            crop: sorted(df.loc[df["Crop"] == crop, "Variety"].dropna().astype(str).unique().tolist())
            for crop in sorted(df["Crop"].dropna().astype(str).unique().tolist())
        }
        rainfall_ranges = {}
        for (state_name, season_name), group in df.groupby(["State", "Season"]):
            rain = pd.to_numeric(group["Annual_Rainfall"], errors="coerce").dropna()
            if rain.empty:
                continue
            rainfall_ranges[f"{state_name}|{season_name}"] = {
                "min": round(float(rain.quantile(0.05)), 1),
                "median": round(float(rain.median()), 1),
                "max": round(float(rain.quantile(0.95)), 1)
            }

        districts_by_state = {}
        if "District" in df.columns:
            districts_by_state = {
                state: sorted(df.loc[df["State"] == state, "District"].dropna().astype(str).unique().tolist())
                for state in sorted(df["State"].dropna().astype(str).unique().tolist())
            }

        seasons_list = ["Kharif", "Rabi", "Whole Year", "Summer", "Autumn", "Winter"]
        filtered_seasons = [s for s in seasons_list if s in set(df["Season"].dropna().astype(str).unique())]
        return {
            "ok": True,
            "states": sorted(df["State"].dropna().astype(str).unique().tolist()),
            "crops": sorted(df["Crop"].dropna().astype(str).unique().tolist()),
            "varieties": sorted(df["Variety"].dropna().astype(str).unique().tolist()),
            "varietiesByCrop": varieties_by_crop,
            "districtsByState": districts_by_state,
            "rainfallRanges": rainfall_ranges,
            "seasons": filtered_seasons,
            "years": sorted([int(x) for x in df["Crop_Year"].dropna().unique().tolist()], reverse=True)
        }
        
    except Exception as e:
        return {"ok": False, "error": str(e)}
def fnum(data, key, default):
    value = data.get(key, default)
    if value in (None, ""):
        return float(default)
    return float(value)


def predict(data):
    models, scalers, lookup, variety_map, feature_names, _, baselines = load_assets()

    state = str(data.get("state", "Punjab"))
    district = str(data.get("district", "")).strip()
    crop = str(data.get("crop", "Wheat"))
    variety = str(data.get("variety", "HD-2967"))
    season = str(data.get("season", "Rabi"))
    year = int(fnum(data, "year", 2024))
    area = fnum(data, "area", 1.0)
    seed = fnum(data, "seed", 80.0)
    fert = fnum(data, "fertilizer", 150.0)
    pest = fnum(data, "pesticide", 2.0)
    rain = fnum(data, "rainfall", 1100.0)
    temp = fnum(data, "temperature", 28.0)
    stress = fnum(data, "climateStress", 0.0)
    soil = fnum(data, "soilNutrient", 0.5)
    user_cost = fnum(data, "productionCost", 0.0)
    use_cost = bool(data.get("useCustomCost", False))

    match = {}
    if baselines.get("stateDistrictCrop") and district:
        match = baselines["stateDistrictCrop"].get((state, district, crop), {})
    if not match:
        match = baselines["stateCrop"].get((state, crop), {})
    if not match:
        match = {col: 0.0 for col in feature_names}

    baseline = match.get("Yield_Potential_quintal_per_ha", 25.0)

    le_season = variety_map.get("le_season")
    season_encoded = 1
    if le_season is not None and season in list(le_season.classes_):
        season_encoded = int(le_season.transform([season])[0])

    x_df = pd.DataFrame([{
        "Area": area,
        "Fertilizer": fert,
        "Pesticide": pest,
        "Seed_Rate_kg_per_ha": seed,
        "Annual_Rainfall": rain,
        "Actual_Temp": temp,
        "Season": season_encoded
    }])
    x_df["Rain_Anomaly"] = rain - match.get("Annual_Rainfall", 1100.0)
    x_df["Temp_Deviation"] = temp - 25.0
    x_df["Net Ground Water Availability for future use"] = match.get("Net Ground Water Availability for future use", 1000.0)
    district_column = next((name for name in feature_names if "district" in str(name).lower()), None)
    if district_column is not None:
        x_df[district_column] = district
    x_df["Stage of Ground Water Extraction (%)"] = match.get("Stage of Ground Water Extraction (%)", 70.0)
    x_df["Yield_Potential_quintal_per_ha"] = match.get("Yield_Potential_quintal_per_ha", 25.0)
    x_df["Climate_Stress_Index"] = stress
    x_df["Soil_Nutrient_Index"] = soil
    x_df["Crop_Kc_Peak"] = match.get("Crop_Kc_Peak", 1.0)
    x_df["Crop_Maturity"] = match.get("Crop_Maturity", 120.0)
    x_df["Crop_Water_Req"] = match.get("Crop_Water_Req", 500.0)
    x_df["State_Avg_Rain"] = match.get("State_Avg_Rain", 1100.0)
    x_df["State_GW_Stress"] = match.get("State_GW_Stress", 0.5)

    cv = variety_map.get("cv_smooth_series", pd.Series(dtype=float))
    global_mean = float(variety_map.get("global_mean", 0.0))
    try:
        x_df["Variety_Encoded"] = float(cv.loc[(crop, variety)])
    except Exception:
        x_df["Variety_Encoded"] = global_mean

    x_df["Heat_Stress_Quadratic"] = x_df["Actual_Temp"] ** 2
    x_df["Temp_Rain_Interaction"] = x_df["Actual_Temp"] * x_df["Annual_Rainfall"]
    x_df["Fert_Rain_Interaction"] = x_df["Fertilizer"] * x_df["Annual_Rainfall"]
    x_df["Water_Fertilizer_Ratio"] = x_df["Annual_Rainfall"] / (x_df["Fertilizer"] + 1e-6)
    x_df["Pesticide_Per_Area"] = x_df["Pesticide"] / (x_df["Area"] + 0.1)
    x_df["Nutrient_Efficiency_Index"] = (x_df["Fertilizer"] + x_df["Pesticide"]) / (x_df["Seed_Rate_kg_per_ha"] + 1)
    x_df["Growth_Power_Law"] = np.log1p(x_df["Area"] * x_df["Seed_Rate_kg_per_ha"])
    x_df["Synergy_Log"] = np.log1p(x_df["Fertilizer"] * x_df["Actual_Temp"])
    x_df["Harmonic_Resource_Index"] = 2 / ((1 / (x_df["Fertilizer"] + 1)) + (1 / (x_df["Annual_Rainfall"] + 1)))
    x_df["Heat_Drought_Index"] = x_df["Temp_Deviation"] / ((x_df["Annual_Rainfall"] / 1000.0) + 1e-6)
    x_df["Growing_Stress"] = abs(x_df["Climate_Stress_Index"]) * (1 + x_df["State_GW_Stress"])
    x_df["Rain_Efficiency"] = x_df["Annual_Rainfall"] / (x_df["Crop_Water_Req"] + 1e-6)

    group = crop_group(lookup, crop)
    selected_model = models.get(group) or next(iter(models.values()))
    selected_scaler = scalers.get(group) or next(iter(scalers.values()))

    # Ensure the feature matrix matches exactly what the scaler/model expect.
    required_features = list(getattr(selected_scaler, "feature_names_in_", feature_names))
    for feature in required_features:
        if feature not in x_df.columns:
            x_df[feature] = 0.0

    x_final = x_df[required_features]
    raw_pred_log = float(selected_model.predict(selected_scaler.transform(x_final))[0])
    base_q_yield = float(np.expm1(raw_pred_log) * 10)
   #DYNAMIC CALIBRATION MAP
    state_districts = CALIBRATION_MAP.get(state, {})
    if district in state_districts and crop in state_districts[district]:
        calibration_factor = state_districts[district][crop]
    else:
        # Fallback if specific district/crop data is missing 
        calibration_factor = 1.0
        
    final_q_yield = base_q_yield * calibration_factor

    # Dynamic Market Price Logic
    # Incorporates Mandi Dynamics, Export Demand, and Crop Quality Premiums
    base_msp = MSP_DB.get(crop, 2200)
    
    # 1. Mandi Dynamics & Export Demand (Simulated volatility: +/- 12%)
    # Seeded by inputs to keep results deterministic per farm configuration
    rng = np.random.RandomState((sum(ord(c) for c in (state + crop + season)) + year) % (2**32))
    mandi_factor = rng.uniform(0.88, 1.12)
    
    # 2. Quality Premium (Based on yield performance relative to regional baseline)
    perf_ratio = final_q_yield / baseline if baseline > 0 else 1.0
    # Premium ranges from -5% (poor yield/quality) to +15% (elite yield/quality)
    quality_factor = 1.0 + max(-0.05, min(0.15, (perf_ratio - 0.4) * 0.3))
    
    market_price = base_msp * mandi_factor * quality_factor
    revenue = final_q_yield * market_price * area

    if use_cost and user_cost > 0:
        cost = user_cost * area
    else:
        cost = ((seed * 85) + (fert * 38) + (pest * 500)) * area
    profit = revenue - cost
    roi = (profit / cost * 100) if cost > 0 else 0.0
    label, color, note = performance_layer(final_q_yield / 10, baseline)

    return {
        "ok": True,
        "state": state,
        "crop": crop,
        "variety": variety,
        "season": season,
        "year": year,
        "cropGroup": group,
        "yield": final_q_yield,
        "msp": base_msp,
        "marketPrice": market_price,
        "revenue": revenue,
        "cost": cost,
        "profit": profit,
        "roi": roi,
        "label": label,
        "color": color,
        "note": note,
        "baselineYield": baseline,
        "engine": "SASYAM grouped ExtraTrees v4"
    }


def local_chat_fallback(data):
    message = str(data.get("message", "")).strip()
    lang = str(data.get("lang", "en"))
    report = data.get("report") or {}
    if not message:
        return {"ok": True, "reply": "Please ask about yield, profit, fertilizer, rainfall, cost, or crop performance."}

    if not report:
        replies = {
            "en": "No report is loaded yet. Generate the precision report first, then I can analyze yield, profit, and risk.",
            "hi": "अभी कोई रिपोर्ट लोड नहीं है। पहले रिपोर्ट बनाइए, फिर मैं उपज, लाभ और जोखिम समझाऊंगा।",
            "bn": "এখনও কোনো রিপোর্ট লোড হয়নি। আগে রিপোর্ট তৈরি করুন, তারপর আমি ফলন, লাভ ও ঝুঁকি বিশ্লেষণ করব।",
            "te": "ఇంకా రిపోర్ట్ లేదు. ముందుగా రిపోర్ట్ రూపొందించండి, తర్వాత దిగుబడి, లాభం, ప్రమాదాన్ని విశ్లేషిస్తాను।",
            "ta": "இன்னும் அறிக்கை இல்லை. முதலில் அறிக்கையை உருவாக்குங்கள், பிறகு மகசூல், லாபம், அபாயம் பற்றி பகுப்பாய்வு செய்கிறேன்.",
            "mr": "अजून रिपोर्ट तयार नाही. आधी रिपोर्ट तयार करा, मग मी उत्पादन, नफा आणि जोखीम समजावतो.",
            "gu": "હજુ રિપોર્ટ તૈયાર નથી. પહેલાં રિપોર્ટ બનાવો, પછી હું ઉપજ, નફો અને જોખમ સમજાવીશ."
        }
        return {"ok": True, "reply": replies.get(lang, replies["en"])}

    yld = float(report.get("yield", 0))
    profit = float(report.get("profit", 0))
    revenue = float(report.get("revenue", 0))
    cost = float(report.get("cost", 0))
    roi = float(report.get("roi", 0))
    crop = report.get("crop", "crop")
    state = report.get("state", "region")
    label = report.get("label", "Performance status")
    note = report.get("note", "")

    text = message.lower()
    if any(word in text for word in ["profit", "लाभ", "নফা", "লাভ", "నాఫా", "லாப", "नफा"]):
        base = f"{crop} in {state}: predicted profit is Rs. {profit:,.0f}, revenue is Rs. {revenue:,.0f}, cost is Rs. {cost:,.0f}, and ROI is {roi:.1f}%."
    elif any(word in text for word in ["fertilizer", "fert", "खाद", "সার", "ఎరువు", "உரம்", "खत"]):
        base = "Fertilizer impact depends on rainfall and nutrient efficiency. If rainfall is low, increasing fertilizer can reduce profit because uptake efficiency falls."
    elif any(word in text for word in ["rain", "water", "drought", "বৃষ্টি", "पाऊस", "बारिश", "నీరు", "மழை"]):
        base = "Water stress is a major driver. Check rainfall, climate stress, and groundwater together before increasing fertilizer or seed intensity."
    elif any(word in text for word in ["yield", "उपज", "ফলন", "దిగుబడి", "மகசூல்", "उत्पादन"]):
        base = f"The predicted yield for {crop} in {state} is {yld:.2f} quintals per hectare. Status: {label}. {note}"
    else:
        base = f"SASYAM analysis: {crop} in {state} is predicted at {yld:.2f} Q/Ha with Rs. {profit:,.0f} net profit. Status: {label}. {note}"

    prefixes = {
        "hi": "SASYAM विश्लेषण: ",
        "bn": "SASYAM বিশ্লেষণ: ",
        "te": "SASYAM విశ్లేషణ: ",
        "ta": "SASYAM பகுப்பாய்வு: ",
        "mr": "SASYAM विश्लेषण: ",
        "gu": "SASYAM વિશ્લેષણ: ",
        "kn": "SASYAM ವಿಶ್ಲೇಷಣೆ: ",
        "ml": "SASYAM വിശകലനം: ",
        "pa": "SASYAM ਵਿਸ਼ਲੇਸ਼ਣ: "
    }
    return {"ok": True, "reply": prefixes.get(lang, "") + base}


def chat(data):
    message = str(data.get("message", "")).strip()
    lang = str(data.get("lang", "en"))
    report = data.get("report") or {}
    if not message:
        return local_chat_fallback(data)
    if not report:
        return local_chat_fallback(data)

    lang_map = {
        "en": "English", "hi": "Hindi", "bn": "Bengali", "te": "Telugu",
        "ta": "Tamil", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
        "ml": "Malayalam", "pa": "Punjabi"
    }
    target_lang = lang_map.get(lang, "English")
    y = float(report.get("yield", 0))
    crop = report.get("crop", "the crop")
    state_name = report.get("state", "your region")
    profit = float(report.get("profit", 0))
    revenue = float(report.get("revenue", 0))
    cost = float(report.get("cost", 0))
    roi = float(report.get("roi", 0))
    csi = report.get("climateStress", report.get("csi", 0.12))
    group = report.get("cropGroup", "model group")
    label = report.get("label", "Performance status")
    note = report.get("note", "")

    analysis_keywords = [
        "profit", "yield", "gap", "improve", "increase", "report", "analysis",
        "revenue", "cost", "fertilizer", "probability", "chance", "success",
        "rain", "water", "crop", "msp", "risk", "soil", "climate"
    ]
    if not any(keyword in message.lower() for keyword in analysis_keywords):
        return {
            "ok": True,
            "reply": f"PROTOCOL RESTRICTION: I am the SASYAM Intelligence Core. Restricted to Yield/Profit analysis as per Souvik's command. Please ask about yield, profit, cost, fertilizer, rainfall, crop risk, or report analysis."
        }

    system_rules = f"""
ROLE: You are the SASYAM Intelligence Core v3.1, developed by Souvik Chakraborty.
DOMAIN: Yield, Profit, and Crop Analytics.
LANGUAGE: CRITICAL! You must respond strictly in {target_lang}.

FERTILIZER PROTOCOL:
- Analyze nutrient efficiency and rainfall together.
- If rainfall is low, warn that more fertilizer can reduce profit due to poor uptake.
- Give practical, farmer-facing advice, not generic text.

PROBABILITY PROTOCOL:
- Use climate stress, crop group, model status, ROI, yield, and profit to explain likely success.
- Keep the answer concise but useful.
"""
    prompt_text = f"""
ANALYSIS DATA:
- Crop/State: {crop} in {state_name}
- Crop group: {group}
- Yield: {y:.2f} Q/Ha
- Revenue: Rs. {revenue:,.0f}
- Cost: Rs. {cost:,.0f}
- Profit: Rs. {profit:,.0f}
- ROI: {roi:.1f}%
- Climate Stress Index: {csi}
- Status: {label}
- Engine note: {note}

USER QUERY: {message}
"""

    groq_key = get_secret("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_rules},
                    {"role": "user", "content": prompt_text}
                ],
                temperature=0.4,
            )
            text = completion.choices[0].message.content
            if text:
                return {"ok": True, "reply": text}
        except Exception as exc:
            groq_error = str(exc)
    else:
        groq_error = "GROQ_API_KEY not found"

    gemini_key = get_secret("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                config=types.GenerateContentConfig(
                    system_instruction=system_rules,
                    temperature=0.4
                ),
                contents=prompt_text
            )
            if response.text:
                return {"ok": True, "reply": response.text}
        except Exception as exc:
            return local_chat_fallback({**data, "message": f"{message}\nAI fallback reason: {groq_error}; Gemini: {exc}"})

    return local_chat_fallback({**data, "message": f"{message}\nAI fallback reason: {groq_error}; GEMINI_API_KEY not found"})


def main():
    try:
        mode = sys.argv[1] if len(sys.argv) > 1 else "predict"
        if mode == "options":
            result = options()
        elif mode == "predict":
            payload = sys.stdin.read().strip() or "{}"
            result = predict(json.loads(payload))
        elif mode == "chat":
            payload = sys.stdin.read().strip() or "{}"
            result = chat(json.loads(payload))
        else:
            result = {"ok": False, "error": f"Unknown mode: {mode}"}
        print(json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
