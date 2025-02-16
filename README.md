# Household Services Application

A full-stack web application connecting customers with service professionals for household services. Built with Flask backend and Vue.js frontend.

## Features

### User Roles
- **Customer**
  - Browse & book services
  - Track service requests
  - Cancel requests
  - Submit reviews
- **Professional**
  - Manage service requests
  - Update request status
  - Receive daily reminders
- **Admin**
  - Manage users and services
  - Generate service reports
  - Export data to CSV
  - Monitor closed services

### Core Functionality
- JWT-based authentication
- Role-based access control
- Redis caching for performance
- Celery background tasks
- Email notifications
- CSV report generation
- Service booking system
- Review system

## Technology Stack

**Backend**
- Flask & Flask-RESTful
- Flask-Security
- SQLAlchemy (SQLite)
- Celery (Redis broker)
- Flask-Caching (Redis)

**Frontend**
- Vue.js 3
- Vue Router
- Bootstrap 5
- Axios (for API calls)

**Other Services**
- Redis (caching & task queue)
- SMTP Server (email notifications)

## Installation

1. **Clone Repository**
