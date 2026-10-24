"""
Bastion X v2.3 — Application Configuration
Environment and database settings for Laptop A.
"""

import os
from pathlib import Path

# Paths
SRC_DIR = Path(__file__).resolve().parent
API_DIR = SRC_DIR.parent
PROJECT_ROOT = API_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

# Environment
BASTION_ENV = os.getenv("BASTION_ENV", "local_dev")

# Blockchain & Bundler URLs (Laptop B)
CHAIN_ID = int(os.getenv("CHAIN_ID", "31337"))
CHAIN_RPC_URL = os.getenv("CHAIN_RPC_URL", "http://127.0.0.1:8545")
BUNDLER_URL = os.getenv("BUNDLER_URL", "http://127.0.0.1:3000")

# Database Path & Connection String
DATABASE_PATH = API_DIR / "bastion_projection.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")

# Policy Parameters
DAILY_SPENDING_CAP_BUSD = 100.0
MAX_PER_TX_BUSD = 50.0
RECOVERY_DELAY_SECONDS = 172800  # 48 hours
GUARDIAN_QUORUM = 3


class Settings:
    bastion_env: str = BASTION_ENV
    chain_id: int = CHAIN_ID
    chain_rpc_url: str = CHAIN_RPC_URL
    bundler_url: str = BUNDLER_URL
    database_url: str = DATABASE_URL
    database_path: Path = DATABASE_PATH
    daily_spending_cap: float = DAILY_SPENDING_CAP_BUSD
    max_per_tx: float = MAX_PER_TX_BUSD
    recovery_delay: int = RECOVERY_DELAY_SECONDS
    guardian_quorum: int = GUARDIAN_QUORUM


settings = Settings()
Config = Settings
