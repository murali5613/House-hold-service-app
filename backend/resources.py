from flask_restful import Resource, Api, reqparse, fields, marshal_with
from flask_security import auth_required, roles_required
from .models import Service, db
from backend.instances import cache


api = Api(prefix='/api')
parser = reqparse.RequestParser()
parser.add_argument('name', type=str, required=True, help='Name is required')
parser.add_argument('price', type=float, required=True, help='Price is required')
parser.add_argument('time_required', type=int, required=False)
parser.add_argument('description', type=str, required=False)

service_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'price': fields.Float,
    'time_required': fields.Integer,
    'description': fields.String
}

class ServiceResource(Resource):
    @marshal_with(service_fields)
    @cache.cached(timeout=300)
    def get(self):
        services = Service.query.all()
        return services or []
    
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        args = parser.parse_args()
        service = Service(**args)
        db.session.add(service)
        db.session.commit()
        cache.clear()
        return {'message': 'Service created successfully', 'data': args}, 201
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, service_id=None):
        if service_id is None:
            return {'error': 'Service ID is required'}, 400
            
        service = Service.query.get_or_404(service_id)
        db.session.delete(service)
        db.session.commit()
        cache.clear()
        return {'message': 'Service deleted successfully'}, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, service_id=None):
        if service_id is None:
            return {'error': 'Service ID is required'}, 400
            
        service = Service.query.get_or_404(service_id)
        args = parser.parse_args()
        
        # Update service fields
        for key, value in args.items():
            if value is not None:
                setattr(service, key, value)
                
        db.session.commit()
        cache.clear()
        return {'message': 'Service updated successfully'}, 200

service_book_fields = {
    'id': fields.Integer,
    'service_id': fields.Integer,
    'customer_id': fields.Integer,
    'username': fields.String,
    'professional_id': fields.Integer,
    'status': fields.String(default='pending'),
    'created_at': fields.DateTime,
    'remarks': fields.String(attribute='remarks', default=None)
}

api.add_resource(ServiceResource, '/service', '/service/<int:service_id>')

def clear_cache():
    try:
        cache.clear()
        print("Cache cleared successfully")
    except Exception as e:
        print(f"Error clearing cache: {str(e)}")
