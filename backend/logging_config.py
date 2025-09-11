import logging
import sys
import os
from datetime import datetime

def setup_logging(log_level="DEBUG", log_file="app.log"):
    """Setup comprehensive logging for BlueBank Backend"""
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Configure logging format
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler with daily rotation
            logging.FileHandler(f"logs/{log_file}"),
            # Error file handler
            logging.FileHandler(f"logs/errors_{datetime.now().strftime('%Y%m%d')}.log")
        ]
    )
    
    # Set specific loggers
    loggers = {
        'uvicorn': logging.INFO,
        'fastapi': logging.INFO,
        'psycopg2': logging.DEBUG,
        'sqlalchemy': logging.DEBUG,
    }
    
    for logger_name, level in loggers.items():
        logging.getLogger(logger_name).setLevel(level)
    
    # Create main logger
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured - Level: {log_level}, File: {log_file}")
    
    return logger

def get_logger(name):
    """Get a logger instance with the given name"""
    return logging.getLogger(name) 