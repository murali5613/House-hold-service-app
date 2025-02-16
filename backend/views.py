from flask import current_app as app, jsonify, request, render_template, send_file
from flask_security import auth_required, roles_required, current_user
from flask_restful import marshal, fields
from backend.sec import datastore
from werkzeug.security import check_password_hash, generate_password_hash
from .models import db, User, ServiceRequest, Service
from .tasks import create_resource_csv
from celery.result import AsyncResult
from datetime import datetime
import os

@app.route('/')
def hello_world():
    return render_template('index.html') 

@app.route('/admin')
@auth_required('token')
@roles_required('admin')
def admin():
    return 'Hello, Admin!'

@app.route('/activate/user/<int:user_id>', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def toggle_user_activation(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Toggle active status
    user.active = not user.active
    db.session.commit()
    
    status = "activated" if user.active else "deactivated"
    return jsonify({
        'message': f'User {status} successfully',
        'active': user.active
    }), 200

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('index.html')
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = datastore.find_user(email=email)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if check_password_hash(user.password, data.get('password')) and user.active:
        return jsonify({'token': user.get_auth_token(), "email": user.email, "roles": user.roles[0].name, "active": user.active, "id": user.id}), 200
    else:
        return jsonify({'error': 'Invalid password'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Basic validation for all users
    required_fields = ['email', 'password', 'username', 'role', 'location', 'pincode']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Email, password, username and role are required'}), 400
    
    # Check if user exists
    if datastore.find_user(email=data['email']):
        return jsonify({'error': 'User already exists'}), 400

    # Prepare user data
    user_data = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'username': data['username']
    }
    
    # Handle professional-specific fields
    if data['role'] == 'professional':
        # Validate professional fields
        prof_fields = ['experience_years', 'service_type']
        if not all(field in data for field in prof_fields):
            return jsonify({'error': 'Professional registration requires experience_years and service_type'}), 400
            
        user_data.update({
            'experience_years': data['experience_years'],
            'service_type': data['service_type'],
            'active': False, # Professionals need admin approval
            'location': data['location'],
            'pincode': data['pincode'],
            'document_url': data['document_url']
        })
    else:
        # For customers
        user_data['active'] = True
    
    # Create user
    user = datastore.create_user(**user_data)
    datastore.add_role_to_user(user, data['role'])
    db.session.commit()
    
    return jsonify({
        'message': 'Registration successful',
    }), 201


users_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'active': fields.Boolean,
    'username': fields.String,
    'experience_years': fields.Integer,
    'service_type': fields.String,
    'roles': fields.List(fields.String(attribute='name')),
    'location': fields.String,
    'pincode': fields.String,
    'document_url': fields.String
}

@app.route('/users')
@auth_required('token')
@roles_required('admin')
def all_users():
    users = User.query.all()
    if len(users) == 0:
        return jsonify({'error': 'No users found'}), 404
    return marshal(users, users_fields)





@app.route('/api/my-services', methods=['GET'])
@auth_required('token')
@roles_required('customer')
def get_my_services():
    try:
        services = ServiceRequest.query.filter_by(customer_id=current_user.id).all()
        
        return jsonify([{
            'id': service.id,
            'service_name': service.service_name,
            'date_requested': service.date_of_request.strftime('%Y-%m-%d %H:%M'),
            'status': service.service_status,
            'professional_id': service.professional_id,
            'review': service.review,
            'date_completed': service.date_of_completion.strftime('%Y-%m-%d %H:%M') if service.date_of_completion else None
        } for service in services])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/book/<int:service_id>', methods=['POST'])
@auth_required('token')
@roles_required('customer')
def book_service(service_id):
    # Get the service
    service = Service.query.get_or_404(service_id)
    professional = User.query.filter_by(
        service_type=service.name,
        active=True
    ).first()
    
    if not professional:
        return jsonify({
            'error': 'No available professional found for this service'
        }), 404
        
    # Create service request
    service_request = ServiceRequest(
        service_name=service.name,
        service_id=service.id,
        customer_id=current_user.id,
        professional_id=professional.id,
        service_status='pending'
    )
    
    try:
        db.session.add(service_request)
        db.session.commit()
        return jsonify({
            'message': 'Service booked successfully',
            'request_id': service_request.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to book service'
        }), 500

# Professional Endpoints
@app.route('/api/my-requests', methods=['GET'])
@auth_required('token')
@roles_required('professional')
def my_requests():
    # Get all service requests assigned to this professional
    requests = ServiceRequest.query.join(
        User, ServiceRequest.customer_id == User.id
    ).filter(
        ServiceRequest.professional_id == current_user.id
    ).add_columns(
        User.username,
        User.location
    ).all()
    
    # Format the requests
    formatted_requests = []
    for req, username, location in requests:
        request_data = {
            'id': req.id,
            'service_name': req.service_name,
            'customer_id': req.customer_id,
            'username': username,
            'location': location,
            'date_requested': req.date_of_request.strftime('%Y-%m-%d %H:%M:%S'),
            'status': req.service_status
        }
        if req.date_of_completion:
            request_data['date_completed'] = req.date_of_completion.strftime('%Y-%m-%d %H:%M:%S')
        formatted_requests.append(request_data)
        
    return jsonify(formatted_requests), 200

@app.route('/api/request/<int:id>/status', methods=['PUT'])
@app.route('/api/request/<int:id>/review', methods=['PUT']) 
@auth_required('token')
def update_request_status(id):
    # Get the request
    service_request = ServiceRequest.query.get_or_404(id)
    
    # Verify the user is either the professional or customer for this request
    if service_request.professional_id != current_user.id and service_request.customer_id != current_user.id:
        return jsonify({
            'error': 'Not authorized to update this request'
        }), 403
        
    # Get the new status from request data
    data = request.get_json()
    new_status = data.get('status')
    review = data.get('review')
    
    # If this is a review-only update
    if request.url_rule.rule.endswith('/review'):
        if not review:
            return jsonify({
                'error': 'Review text is required'
            }), 400
            
        if service_request.customer_id != current_user.id:
            return jsonify({
                'error': 'Only customers can add reviews'
            }), 403
            
        if service_request.service_status != 'completed':
            return jsonify({
                'error': 'Can only review completed services'
            }), 400
            
        service_request.review = review
        try:
            db.session.commit()
            return jsonify({
                'message': 'Review added successfully',
                'review': service_request.review
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'error': 'Failed to add review'
            }), 500
    
    # For status updates
    if not new_status:
        return jsonify({
            'error': 'Status is required'
        }), 400
        
    # Validate status transition
    valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({
            'error': 'Invalid status'
        }), 400
        
    # Only allow professionals to set in_progress or completed
    if new_status in ['in_progress', 'completed'] and service_request.professional_id != current_user.id:
        return jsonify({
            'error': 'Only professionals can set this status'
        }), 403
        
    # Only allow customers to cancel pending requests or add reviews
    if new_status == 'cancelled' and service_request.customer_id != current_user.id:
        return jsonify({
            'error': 'Only customers can cancel requests'
        }), 403
        
    if review is not None:
        if service_request.customer_id != current_user.id:
            return jsonify({
                'error': 'Only customers can add reviews'
            }), 403
        if service_request.service_status != 'completed':
            return jsonify({
                'error': 'Can only review completed services'
            }), 400
        service_request.review = review
    
    # Update the status
    service_request.service_status = new_status
    
    # If completing or cancelling, set completion date
    if new_status in ['completed', 'cancelled']:
        service_request.date_of_completion = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Request updated successfully',
            'status': new_status,
            'review': service_request.review
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update request'
        }), 500





@app.route('/api/services/closed', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_closed_services():
    # Get all completed or cancelled services
    closed_services = ServiceRequest.query.filter(
        ServiceRequest.service_status.in_(['completed', 'cancelled'])
    ).all()
    
    if not closed_services:
        return jsonify([]), 200  # Return empty array instead of 404
        
    # Format the response data
    services = []
    for request in closed_services:
        service = {
            'id': request.id,
            'service_name': request.service_name,
            'date_completed': request.date_of_completion.strftime('%Y-%m-%d %H:%M:%S') if request.date_of_completion else None,
            'status': request.service_status,
            'customer_id': request.customer_id,
            'professional_id': request.professional_id,
            'review': request.review
        }
        services.append(service)
        
    return jsonify(services), 200


# This should be the last route
@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')


@app.get('/download-csv')
@auth_required('token')
@roles_required('admin')
def download_csv():
    try:
        task = create_resource_csv.delay()
        return jsonify({"task-id": task.id})
    except Exception as e:
        print(f"Error starting export task: {str(e)}")
        return jsonify({"error": "Failed to start export"}), 500

@app.get('/get-csv/<task_id>')
@auth_required('token')
@roles_required('admin')
def get_csv(task_id):
    try:
        res = AsyncResult(task_id)
        if res.ready():
            file_name = res.result
            if os.path.exists(file_name):
                response = send_file(
                    file_name,
                    as_attachment=True,
                    download_name=os.path.basename(file_name),
                    mimetype='text/csv'
                )
                # Add CORS headers
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            else:
                return jsonify({
                    'error': 'File not found'
                }), 404
        else:
            return jsonify({
                'status': 'pending'
            }), 202
    except Exception as e:
        print(f"Error in get_csv: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve file'
        }), 500