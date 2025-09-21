# ABY Challenge Backend

A FastAPI application for the ABY Challenge project.

## 🚀 Getting Started

Follow these steps to set up and run the backend application:

### 🐍 1. Create and Activate a Python Virtual Environment

It's recommended to use a virtual environment to manage project dependencies.

```bash
python3 -m venv venv
source venv/bin/activate
```

### 📦 2. Install Dependencies

Install the required Python packages using pip:

```bash
pip install -r requirements.txt
```

### ⚙️ 3. Environment Variables

Create a `.env` file in the `backend/` directory with the following:

## Environment Variables

Create a `.env` file in the backend directory with:
```env
# Replicate API Token (required)
REPLICATE_API_TOKEN = {your_api_key}

# Database Password (required)
POSTGRES_PASSWORD = "Postgres12!"
```