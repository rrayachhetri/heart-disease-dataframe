@echo off
cd /d C:\heart-disease\heart-disease-dataframe\heart-disease
set PYTHONPATH=C:\heart-disease\heart-disease-dataframe\heart-disease
echo Starting CardioSense API on http://127.0.0.1:8080 ...
C:\Users\rrchh\anaconda3\python.exe -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload
