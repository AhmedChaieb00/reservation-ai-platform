"""Database connection service for AI backend."""
import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

_engine = None
_Session = None


def get_engine():
    global _engine
    if _engine is None:
        url = os.environ.get('DATABASE_URL')
        if not url:
            logger.error("DATABASE_URL is not set; AI features that need the database are disabled")
            return None
        try:
            _engine = create_engine(url, pool_pre_ping=True, pool_recycle=3600)
            logger.info("Database engine created")
        except Exception as e:
            logger.error(f"Failed to create engine: {e}")
            _engine = None
    return _engine


def get_session():
    global _Session
    engine = get_engine()
    if engine and _Session is None:
        _Session = sessionmaker(bind=engine)
    return _Session() if _Session else None


def execute_query(query, params=None):
    """Execute a raw SQL query and return results as list of dicts."""
    engine = get_engine()
    if not engine:
        return []
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]
    except Exception as e:
        logger.error(f"Query error: {e}")
        return []
