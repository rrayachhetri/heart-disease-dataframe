@echo off
cd /d "C:\heart-disease\heart-disease-dataframe\heart-disease"
python -m pip install sqlalchemy>=2.0 alembic>=1.13 "passlib[bcrypt]>=1.7" "python-jose[cryptography]>=3.3" python-multipart>=0.0.6
pause
