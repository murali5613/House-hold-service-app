class Config:
    DEBUG = False
    TESTING = False
    CACHE_TYPE = 'RedisCache'
    CACHE_DEFAULT_TIMEOUT = 300


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'
    SECRET_KEY = "3uhfiu43ui3"
    SECURITY_PASSWORD_SALT = "kljmio4ui3jh54"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    SECURITY_PASSWORD_HASH = 'bcrypt'
    
    # Add these lines to disable Flask-Security's default routes
    SECURITY_LOGIN_URL = False
    SECURITY_LOGOUT_URL = False
    SECURITY_REGISTER_URL = False
    
    # Optional: Disable redirects for unauthorized access
    SECURITY_UNAUTHORIZED_VIEW = None
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 3
